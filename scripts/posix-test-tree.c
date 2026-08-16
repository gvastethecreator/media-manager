#define _GNU_SOURCE

#include <errno.h>
#include <dirent.h>
#include <fcntl.h>
#include <signal.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

enum {
	POLL_INTERVAL_MICROSECONDS = 25000,
	TERM_GRACE_MILLISECONDS = 2000,
	KILL_TIMEOUT_MILLISECONDS = 10000,
	DELETE_CONTROL_TIMEOUT_MILLISECONDS = 30000,
};

static volatile sig_atomic_t emergency_stop_requested = 0;

typedef struct {
	char *nonce;
	char *working_directory;
	char *status_path;
	char *stop_path;
	char **command;
	int command_length;
} helper_config;

static long long monotonic_milliseconds(void) {
	struct timespec now;
	if (clock_gettime(CLOCK_MONOTONIC, &now) != 0) {
		return 0;
	}
	return (long long)now.tv_sec * 1000LL + now.tv_nsec / 1000000LL;
}

static void handle_emergency_stop(int signal_number) {
	(void)signal_number;
	emergency_stop_requested = 1;
}

static void trim_newline(char *value) {
	size_t length = strlen(value);
	while (length > 0 && (value[length - 1] == '\n' || value[length - 1] == '\r')) {
		value[--length] = '\0';
	}
}

static int base64_value(unsigned char character) {
	if (character >= 'A' && character <= 'Z') return character - 'A';
	if (character >= 'a' && character <= 'z') return character - 'a' + 26;
	if (character >= '0' && character <= '9') return character - '0' + 52;
	if (character == '+') return 62;
	if (character == '/') return 63;
	return -1;
}

static char *decode_base64(const char *input) {
	size_t input_length = strlen(input);
	char *output = calloc(input_length * 3 / 4 + 2, 1);
	if (output == NULL) return NULL;
	uint32_t accumulator = 0;
	int bit_count = 0;
	size_t output_index = 0;
	for (size_t index = 0; index < input_length; index += 1) {
		if (input[index] == '=') break;
		int value = base64_value((unsigned char)input[index]);
		if (value < 0) {
			free(output);
			return NULL;
		}
		accumulator = (accumulator << 6) | (uint32_t)value;
		bit_count += 6;
		if (bit_count >= 8) {
			bit_count -= 8;
			output[output_index++] = (char)((accumulator >> bit_count) & 0xffU);
		}
	}
	output[output_index] = '\0';
	return output;
}

static char *encode_base64(const char *input) {
	static const char alphabet[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	size_t input_length = strlen(input);
	size_t output_length = ((input_length + 2) / 3) * 4;
	char *output = malloc(output_length + 1);
	if (output == NULL) return NULL;
	size_t input_index = 0;
	size_t output_index = 0;
	while (input_index < input_length) {
		uint32_t first = (unsigned char)input[input_index++];
		uint32_t second = input_index < input_length ? (unsigned char)input[input_index++] : 0;
		uint32_t third = input_index < input_length ? (unsigned char)input[input_index++] : 0;
		uint32_t triple = (first << 16) | (second << 8) | third;
		output[output_index++] = alphabet[(triple >> 18) & 0x3fU];
		output[output_index++] = alphabet[(triple >> 12) & 0x3fU];
		output[output_index++] = alphabet[(triple >> 6) & 0x3fU];
		output[output_index++] = alphabet[triple & 0x3fU];
	}
	if (input_length % 3 == 1) {
		output[output_length - 1] = '=';
		output[output_length - 2] = '=';
	} else if (input_length % 3 == 2) {
		output[output_length - 1] = '=';
	}
	output[output_length] = '\0';
	return output;
}

static bool read_config(const char *path, helper_config *config) {
	FILE *file = fopen(path, "r");
	if (file == NULL) return false;
	char *line = NULL;
	size_t capacity = 0;
	ssize_t length = getline(&line, &capacity, file);
	if (length <= 0) goto failure;
	trim_newline(line);
	config->nonce = strdup(line);

	char **decoded_fields[] = {&config->working_directory, &config->status_path, &config->stop_path};
	for (size_t index = 0; index < 3; index += 1) {
		length = getline(&line, &capacity, file);
		if (length <= 0) goto failure;
		trim_newline(line);
		*decoded_fields[index] = decode_base64(line);
		if (*decoded_fields[index] == NULL) goto failure;
	}

	length = getline(&line, &capacity, file);
	if (length <= 0) goto failure;
	trim_newline(line);
	char *end = NULL;
	long command_length = strtol(line, &end, 10);
	if (end == line || *end != '\0' || command_length <= 0 || command_length > 65535) goto failure;
	config->command_length = (int)command_length;
	config->command = calloc((size_t)config->command_length + 1, sizeof(char *));
	if (config->command == NULL) goto failure;
	for (int index = 0; index < config->command_length; index += 1) {
		length = getline(&line, &capacity, file);
		if (length <= 0) goto failure;
		trim_newline(line);
		config->command[index] = decode_base64(line);
		if (config->command[index] == NULL) goto failure;
	}
	config->command[config->command_length] = NULL;
	free(line);
	fclose(file);
	return true;

failure:
	free(line);
	fclose(file);
	return false;
}

static void free_config(helper_config *config) {
	free(config->nonce);
	free(config->working_directory);
	free(config->status_path);
	free(config->stop_path);
	if (config->command != NULL) {
		for (int index = 0; index < config->command_length; index += 1) free(config->command[index]);
		free(config->command);
	}
}

static bool write_status(
	const helper_config *config,
	const char *state,
	pid_t child_process_id,
	const char *payload,
	const char *proof) {
	char temporary_path[4096];
	int path_length = snprintf(temporary_path, sizeof(temporary_path), "%s.tmp-%ld", config->status_path, (long)getpid());
	if (path_length < 0 || (size_t)path_length >= sizeof(temporary_path)) return false;
	FILE *file = fopen(temporary_path, "w");
	if (file == NULL) return false;
	bool written = fprintf(
		file,
		"%s\n%s\n%ld\n%s\n%s\n",
		state,
		config->nonce,
		(long)child_process_id,
		payload == NULL ? "" : payload,
		proof == NULL ? "" : proof) >= 0;
	if (written) written = fflush(file) == 0 && fsync(fileno(file)) == 0;
	if (fclose(file) != 0) written = false;
	if (!written || rename(temporary_path, config->status_path) != 0) {
		unlink(temporary_path);
		return false;
	}
	return true;
}

static void write_error(const helper_config *config, pid_t child_process_id, const char *message) {
	char *encoded = encode_base64(message);
	if (encoded != NULL) {
		write_status(config, "error", child_process_id, encoded, NULL);
		free(encoded);
	}
}

static bool stop_requested(const helper_config *config) {
	if (emergency_stop_requested != 0) return true;
	if (getenv("MEDIA_MANAGER_TEST_JOB_IGNORE_STOP") != NULL) return false;
	return access(config->stop_path, F_OK) == 0;
}

static bool same_identity(const struct stat *left, const struct stat *right) {
	return left->st_dev == right->st_dev && left->st_ino == right->st_ino &&
		(left->st_mode & S_IFMT) == (right->st_mode & S_IFMT);
}

static bool write_text_file_no_follow(const char *path, const char *content) {
	int file = open(path, O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW, 0600);
	if (file < 0) return false;
	size_t length = strlen(content);
	size_t written = 0;
	while (written < length) {
		ssize_t result = write(file, content + written, length - written);
		if (result < 0) {
			if (errno == EINTR) continue;
			close(file);
			return false;
		}
		written += (size_t)result;
	}
	bool success = fsync(file) == 0;
	if (close(file) != 0) success = false;
	return success;
}

static int read_control_file_no_follow(const char *path, char *content, size_t capacity) {
	int file = open(path, O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
	if (file < 0) return errno == ENOENT ? 0 : -1;
	struct stat info;
	if (fstat(file, &info) != 0 || !S_ISREG(info.st_mode)) {
		close(file);
		return -1;
	}
	ssize_t length = read(file, content, capacity - 1);
	int read_error = errno;
	if (close(file) != 0 && length >= 0) return -1;
	if (length < 0) {
		errno = read_error;
		return -1;
	}
	content[length] = '\0';
	return 1;
}

static bool delete_directory_contents_at(int directory, dev_t root_device);

static bool delete_entry_at(int directory, const char *name, dev_t root_device) {
	struct stat path_info;
	if (fstatat(directory, name, &path_info, AT_SYMLINK_NOFOLLOW) != 0) return false;
	if (S_ISLNK(path_info.st_mode) || path_info.st_dev != root_device) return false;

	int entry = openat(directory, name, O_PATH | O_CLOEXEC | O_NOFOLLOW);
	if (entry < 0) return false;
	struct stat handle_info;
	bool valid = fstat(entry, &handle_info) == 0 && same_identity(&path_info, &handle_info) &&
		!S_ISLNK(handle_info.st_mode) && handle_info.st_dev == root_device;
	if (!valid) {
		close(entry);
		return false;
	}

	if (S_ISDIR(handle_info.st_mode)) {
		int child_directory = openat(directory, name, O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW);
		if (child_directory < 0) {
			close(entry);
			return false;
		}
		struct stat child_info;
		valid = fstat(child_directory, &child_info) == 0 && same_identity(&handle_info, &child_info) &&
			delete_directory_contents_at(child_directory, root_device);
		if (close(child_directory) != 0) valid = false;
		struct stat current_info;
		if (valid) {
			valid = fstatat(directory, name, &current_info, AT_SYMLINK_NOFOLLOW) == 0 &&
				same_identity(&handle_info, &current_info);
		}
		if (valid) valid = unlinkat(directory, name, AT_REMOVEDIR) == 0;
	} else {
		struct stat current_info;
		valid = fstatat(directory, name, &current_info, AT_SYMLINK_NOFOLLOW) == 0 &&
			same_identity(&handle_info, &current_info);
		if (valid) valid = unlinkat(directory, name, 0) == 0;
	}

	if (close(entry) != 0) valid = false;
	return valid;
}

static bool delete_directory_contents_at(int directory, dev_t root_device) {
	int scan_descriptor = dup(directory);
	if (scan_descriptor < 0) return false;
	DIR *scan = fdopendir(scan_descriptor);
	if (scan == NULL) {
		close(scan_descriptor);
		return false;
	}

	bool success = true;
	errno = 0;
	struct dirent *entry = NULL;
	while ((entry = readdir(scan)) != NULL) {
		if (strcmp(entry->d_name, ".") == 0 || strcmp(entry->d_name, "..") == 0) continue;
		if (!delete_entry_at(directory, entry->d_name, root_device)) {
			success = false;
			break;
		}
		errno = 0;
	}
	if (entry == NULL && errno != 0) success = false;
	if (closedir(scan) != 0) success = false;
	return success;
}

static int delete_tree_with_handshake(const char *root_path, const char *ready_path, const char *control_path) {
	size_t root_length = strlen(root_path);
	if (root_length < 2 || root_path[0] != '/' || root_path[root_length - 1] == '/') {
		fprintf(stderr, "La ruta del directorio de borrado POSIX es inválida.\n");
		return 1;
	}
	const char *separator = strrchr(root_path, '/');
	if (separator == NULL || separator[1] == '\0') return 1;
	char *parent_path = separator == root_path ? strdup("/") : strndup(root_path, (size_t)(separator - root_path));
	char *root_name = strdup(separator + 1);
	if (parent_path == NULL || root_name == NULL) {
		free(parent_path);
		free(root_name);
		return 1;
	}

	int result = 1;
	int parent = open(parent_path, O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW);
	int root = -1;
	if (parent < 0) goto cleanup;
	root = openat(parent, root_name, O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW);
	if (root < 0) goto cleanup;
	struct stat parent_info;
	struct stat root_info;
	if (fstat(parent, &parent_info) != 0 || fstat(root, &root_info) != 0 ||
		!S_ISDIR(root_info.st_mode) || root_info.st_dev != parent_info.st_dev) {
		fprintf(stderr, "Se rechazó un symlink o mount escape en el borrado POSIX.\n");
		goto cleanup;
	}

	if (!write_text_file_no_follow(ready_path, "locked")) goto cleanup;
	long long deadline = monotonic_milliseconds() + DELETE_CONTROL_TIMEOUT_MILLISECONDS;
	char control[32];
	int control_state = 0;
	while (monotonic_milliseconds() < deadline) {
		control_state = read_control_file_no_follow(control_path, control, sizeof(control));
		if (control_state != 0) break;
		usleep(POLL_INTERVAL_MICROSECONDS);
	}
	if (control_state < 0) goto cleanup;
	if (control_state == 0) {
		fprintf(stderr, "No se recibió control para el borrado POSIX por dirfd.\n");
		goto cleanup;
	}
	trim_newline(control);
	if (strcmp(control, "delete") != 0) {
		result = 2;
		goto cleanup;
	}

	if (!delete_directory_contents_at(root, root_info.st_dev)) goto cleanup;
	struct stat current_handle_info;
	struct stat current_path_info;
	if (fstat(root, &current_handle_info) != 0 || !same_identity(&root_info, &current_handle_info) ||
		fstatat(parent, root_name, &current_path_info, AT_SYMLINK_NOFOLLOW) != 0 ||
		!same_identity(&root_info, &current_path_info)) {
		fprintf(stderr, "La identidad del root cambió antes de unlinkat.\n");
		goto cleanup;
	}
	if (unlinkat(parent, root_name, AT_REMOVEDIR) != 0) goto cleanup;
	if (fstatat(parent, root_name, &current_path_info, AT_SYMLINK_NOFOLLOW) == 0 || errno != ENOENT) goto cleanup;
	result = 0;

cleanup:
	if (root >= 0) close(root);
	if (parent >= 0) close(parent);
	free(parent_path);
	free(root_name);
	return result;
}

static bool list_direct_children(pid_t **children, size_t *count) {
	char path[128];
	snprintf(path, sizeof(path), "/proc/self/task/%ld/children", (long)getpid());
	FILE *file = fopen(path, "r");
	if (file == NULL) return false;
	size_t capacity = 8;
	pid_t *result = malloc(capacity * sizeof(pid_t));
	if (result == NULL) {
		fclose(file);
		return false;
	}
	*count = 0;
	long value = 0;
	while (fscanf(file, "%ld", &value) == 1) {
		if (*count == capacity) {
			capacity *= 2;
			pid_t *expanded = realloc(result, capacity * sizeof(pid_t));
			if (expanded == NULL) {
				free(result);
				fclose(file);
				return false;
			}
			result = expanded;
		}
		result[(*count)++] = (pid_t)value;
	}
	fclose(file);
	*children = result;
	return true;
}

static bool signal_direct_children(int signal_number) {
	pid_t *children = NULL;
	size_t count = 0;
	if (!list_direct_children(&children, &count)) return false;
	for (size_t index = 0; index < count; index += 1) {
		if (kill(children[index], signal_number) != 0 && errno != ESRCH) {
			free(children);
			return false;
		}
	}
	free(children);
	return true;
}

static bool reap_until_empty(int signal_number, int timeout_milliseconds) {
	long long deadline = monotonic_milliseconds() + timeout_milliseconds;
	while (monotonic_milliseconds() < deadline) {
		int status = 0;
		pid_t reaped = 0;
		do {
			reaped = waitpid(-1, &status, WNOHANG);
		} while (reaped > 0);
		if (reaped < 0 && errno == ECHILD) return true;
		if (!signal_direct_children(signal_number)) return false;
		usleep(POLL_INTERVAL_MICROSECONDS);
	}
	return false;
}

static bool terminate_and_reap_tree(void) {
	if (reap_until_empty(SIGTERM, TERM_GRACE_MILLISECONDS)) return true;
	return reap_until_empty(SIGKILL, KILL_TIMEOUT_MILLISECONDS);
}

static int exit_code_from_status(int status) {
	if (WIFEXITED(status)) return WEXITSTATUS(status);
	if (WIFSIGNALED(status)) return 128 + WTERMSIG(status);
	return 1;
}

int main(int argument_count, char **arguments) {
	if (argument_count == 5 && strcmp(arguments[1], "--delete-tree") == 0) {
		return delete_tree_with_handshake(arguments[2], arguments[3], arguments[4]);
	}
	if (argument_count != 2) {
		fprintf(stderr, "Se esperaba una ruta de configuración.\n");
		return 1;
	}
	helper_config config = {0};
	if (!read_config(arguments[1], &config)) {
		fprintf(stderr, "La configuración del helper POSIX es inválida.\n");
		free_config(&config);
		return 1;
	}
	struct sigaction emergency_action;
	memset(&emergency_action, 0, sizeof(emergency_action));
	emergency_action.sa_handler = handle_emergency_stop;
	sigemptyset(&emergency_action.sa_mask);
	if (sigaction(SIGUSR1, &emergency_action, NULL) != 0) {
		write_error(&config, 0, "No se pudo instalar el fallback SIGUSR1.");
		free_config(&config);
		return 1;
	}
	if (prctl(PR_SET_CHILD_SUBREAPER, 1) != 0) {
		write_error(&config, 0, "PR_SET_CHILD_SUBREAPER falló.");
		free_config(&config);
		return 1;
	}

	pid_t root_process_id = fork();
	if (root_process_id < 0) {
		write_error(&config, 0, "fork falló.");
		free_config(&config);
		return 1;
	}
	if (root_process_id == 0) {
		setpgid(0, 0);
		if (chdir(config.working_directory) != 0) _exit(126);
		execvp(config.command[0], config.command);
		_exit(127);
	}

	if (!write_status(&config, "ready", root_process_id, NULL, NULL)) {
		kill(root_process_id, SIGKILL);
		terminate_and_reap_tree();
		free_config(&config);
		return 1;
	}

	int root_status = 0;
	bool root_reaped = false;
	bool stopping = false;
	while (!root_reaped && !stopping) {
		stopping = stop_requested(&config);
		pid_t reaped = waitpid(-1, &root_status, WNOHANG);
		if (reaped == root_process_id) {
			root_reaped = true;
		} else if (reaped < 0 && errno != EINTR) {
			write_error(&config, root_process_id, "waitpid falló antes de la salida raíz.");
			free_config(&config);
			return 1;
		}
		usleep(POLL_INTERVAL_MICROSECONDS);
	}

	int result = stopping ? 143 : exit_code_from_status(root_status);
	if (!terminate_and_reap_tree()) {
		write_error(&config, root_process_id, "No se pudo confirmar ECHILD tras terminar el árbol POSIX.");
		free_config(&config);
		return 1;
	}
	char exit_code[32];
	snprintf(exit_code, sizeof(exit_code), "%d", result);
	if (!write_status(&config, "completed", root_process_id, exit_code, "tree-empty")) {
		free_config(&config);
		return 1;
	}
	free_config(&config);
	return result;
}
