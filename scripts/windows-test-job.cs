using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public static class MediaManagerIsolatedTestJob
{
	private static readonly Stopwatch Clock = Stopwatch.StartNew();
    private const uint CreateSuspended = 0x00000004;
    private const uint StartfUseStdHandles = 0x00000100;
    private const uint JobObjectLimitKillOnJobClose = 0x00002000;
    private const uint WaitObject0 = 0x00000000;
    private const uint WaitTimeout = 0x00000102;
    private const int JobObjectBasicAccountingInformationClass = 1;
    private const int JobObjectExtendedLimitInformationClass = 9;
    private const int StdInputHandle = -10;
    private const int StdOutputHandle = -11;
    private const int StdErrorHandle = -12;
    private const int PollIntervalMilliseconds = 25;
    private const int JobExitTimeoutMilliseconds = 10000;
	private const uint DeleteAccess = 0x00010000;
	private const uint FileListDirectory = 0x00000001;
	private const uint FileReadAttributes = 0x00000080;
	private const uint FileShareRead = 0x00000001;
	private const uint FileShareWrite = 0x00000002;
	private const uint OpenExisting = 3;
	private const uint FileFlagBackupSemantics = 0x02000000;
	private const uint FileFlagOpenReparsePoint = 0x00200000;
	private const uint FileAttributeDirectory = 0x00000010;
	private const uint FileAttributeReparsePoint = 0x00000400;
	private const int FileDispositionInfoClass = 4;
	private const int FileAttributeTagInfoClass = 9;
	private const int DeleteControlTimeoutMilliseconds = 30000;

    [StructLayout(LayoutKind.Sequential)]
    private struct StartupInfo
    {
        public uint cb;
        public IntPtr lpReserved;
        public IntPtr lpDesktop;
        public IntPtr lpTitle;
        public uint dwX;
        public uint dwY;
        public uint dwXSize;
        public uint dwYSize;
        public uint dwXCountChars;
        public uint dwYCountChars;
        public uint dwFillAttribute;
        public uint dwFlags;
        public ushort wShowWindow;
        public ushort cbReserved2;
        public IntPtr lpReserved2;
        public IntPtr hStdInput;
        public IntPtr hStdOutput;
        public IntPtr hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct ProcessInformation
    {
        public IntPtr hProcess;
        public IntPtr hThread;
        public uint dwProcessId;
        public uint dwThreadId;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct JobObjectBasicLimitInformation
    {
        public long PerProcessUserTimeLimit;
        public long PerJobUserTimeLimit;
        public uint LimitFlags;
        public UIntPtr MinimumWorkingSetSize;
        public UIntPtr MaximumWorkingSetSize;
        public uint ActiveProcessLimit;
        public UIntPtr Affinity;
        public uint PriorityClass;
        public uint SchedulingClass;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct IoCounters
    {
        public ulong ReadOperationCount;
        public ulong WriteOperationCount;
        public ulong OtherOperationCount;
        public ulong ReadTransferCount;
        public ulong WriteTransferCount;
        public ulong OtherTransferCount;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct JobObjectExtendedLimitInformation
    {
        public JobObjectBasicLimitInformation BasicLimitInformation;
        public IoCounters IoInfo;
        public UIntPtr ProcessMemoryLimit;
        public UIntPtr JobMemoryLimit;
        public UIntPtr PeakProcessMemoryUsed;
        public UIntPtr PeakJobMemoryUsed;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct JobObjectBasicAccountingInformation
    {
        public long TotalUserTime;
        public long TotalKernelTime;
        public long ThisPeriodTotalUserTime;
        public long ThisPeriodTotalKernelTime;
        public uint TotalPageFaultCount;
        public uint TotalProcesses;
        public uint ActiveProcesses;
        public uint TotalTerminatedProcesses;
    }

	[StructLayout(LayoutKind.Sequential)]
	private struct FileAttributeTagInfo
	{
		public uint FileAttributes;
		public uint ReparseTag;
	}

	[StructLayout(LayoutKind.Sequential)]
	private struct FileDispositionInfo
	{
		[MarshalAs(UnmanagedType.Bool)]
		public bool DeleteFile;
	}

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateJobObject(IntPtr jobAttributes, string name);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetInformationJobObject(
        IntPtr job,
        int informationClass,
        ref JobObjectExtendedLimitInformation information,
        uint informationLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool QueryInformationJobObject(
        IntPtr job,
        int informationClass,
        out JobObjectBasicAccountingInformation information,
        uint informationLength,
        IntPtr returnLength);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CreateProcess(
        string applicationName,
        StringBuilder commandLine,
        IntPtr processAttributes,
        IntPtr threadAttributes,
        bool inheritHandles,
        uint creationFlags,
        IntPtr environment,
        string currentDirectory,
        ref StartupInfo startupInfo,
        out ProcessInformation processInformation);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern uint ResumeThread(IntPtr thread);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern uint WaitForSingleObject(IntPtr handle, uint milliseconds);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool GetExitCodeProcess(IntPtr process, out uint exitCode);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool TerminateProcess(IntPtr process, uint exitCode);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool TerminateJobObject(IntPtr job, uint exitCode);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr handle);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern IntPtr GetStdHandle(int standardHandle);

	[DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
	private static extern IntPtr CreateFile(
		string fileName,
		uint desiredAccess,
		uint shareMode,
		IntPtr securityAttributes,
		uint creationDisposition,
		uint flagsAndAttributes,
		IntPtr templateFile);

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern bool GetFileInformationByHandleEx(
		IntPtr file,
		int informationClass,
		out FileAttributeTagInfo information,
		uint informationLength);

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern bool SetFileInformationByHandle(
		IntPtr file,
		int informationClass,
		ref FileDispositionInfo information,
		uint informationLength);

    public static int Main(string[] arguments)
    {
        try
        {
			Debug("inicio");
			if (arguments != null && arguments.Length == 4 && arguments[0] == "--delete-tree")
			{
				return DeleteTreeWithHandshake(arguments[1], arguments[2], arguments[3]);
			}
            if (arguments == null || arguments.Length != 1)
            {
                throw new ArgumentException("Se esperaba una ruta de configuración.");
            }

            string[] lines = File.ReadAllLines(arguments[0], Encoding.UTF8);
            if (lines.Length < 5)
            {
                throw new InvalidDataException("La configuración del Job Object está incompleta.");
            }

            string nonce = lines[0];
            string workingDirectory = Decode(lines[1]);
            string statusPath = Decode(lines[2]);
            string stopPath = Decode(lines[3]);
            int commandLength = Int32.Parse(lines[4], CultureInfo.InvariantCulture);
            if (commandLength <= 0 || lines.Length != commandLength + 5)
            {
                throw new InvalidDataException("La lista de argumentos del Job Object es inválida.");
            }

            var command = new string[commandLength];
            for (int index = 0; index < commandLength; index += 1)
            {
                command[index] = Decode(lines[index + 5]);
            }

            return Run(command, workingDirectory, statusPath, stopPath, nonce);
        }
        catch (Exception error)
        {
            Console.Error.WriteLine(error);
            return 1;
        }
    }

	private static int DeleteTreeWithHandshake(string rootPath, string readyPath, string controlPath)
	{
		IntPtr rootHandle = IntPtr.Zero;
		try
		{
			rootHandle = OpenDeleteHandle(rootPath);
			FileAttributeTagInfo rootInfo = ReadAttributeInfo(rootHandle);
			if ((rootInfo.FileAttributes & FileAttributeDirectory) == 0)
			{
				throw new IOException("El target de borrado no es un directorio.");
			}
			if ((rootInfo.FileAttributes & FileAttributeReparsePoint) != 0)
			{
				throw new IOException("El target de borrado es un reparse point.");
			}

			File.WriteAllText(readyPath, "locked", new UTF8Encoding(false));
			DateTime deadline = DateTime.UtcNow.AddMilliseconds(DeleteControlTimeoutMilliseconds);
			while (!File.Exists(controlPath))
			{
				if (DateTime.UtcNow >= deadline)
				{
					throw new TimeoutException("No se recibió control para el borrado por handle.");
				}
				Thread.Sleep(PollIntervalMilliseconds);
			}
			if (File.ReadAllText(controlPath, Encoding.UTF8).Trim() != "delete")
			{
				return 2;
			}

			DeleteDirectoryContentsLocked(rootPath);
			MarkHandleForDeletion(rootHandle);
			CloseHandle(rootHandle);
			rootHandle = IntPtr.Zero;
			return Directory.Exists(rootPath) ? 1 : 0;
		}
		catch (Exception error)
		{
			Console.Error.WriteLine(error);
			return 1;
		}
		finally
		{
			if (rootHandle != IntPtr.Zero)
			{
				CloseHandle(rootHandle);
			}
		}
	}

	private static void DeleteDirectoryContentsLocked(string directoryPath)
	{
		foreach (string childPath in Directory.EnumerateFileSystemEntries(directoryPath))
		{
			DeleteEntryByHandle(childPath);
		}
	}

	private static void DeleteEntryByHandle(string path)
	{
		IntPtr handle = OpenDeleteHandle(path);
		try
		{
			FileAttributeTagInfo info = ReadAttributeInfo(handle);
			if ((info.FileAttributes & FileAttributeReparsePoint) != 0)
			{
				throw new IOException("Se rechazó un reparse point durante el borrado: " + path);
			}
			if ((info.FileAttributes & FileAttributeDirectory) != 0)
			{
				DeleteDirectoryContentsLocked(path);
			}
			MarkHandleForDeletion(handle);
		}
		finally
		{
			CloseHandle(handle);
		}
	}

	private static IntPtr OpenDeleteHandle(string path)
	{
		IntPtr handle = CreateFile(
			path,
			DeleteAccess | FileListDirectory | FileReadAttributes,
			FileShareRead | FileShareWrite,
			IntPtr.Zero,
			OpenExisting,
			FileFlagBackupSemantics | FileFlagOpenReparsePoint,
			IntPtr.Zero);
		ThrowIfInvalidHandle(handle, "CreateFileW(delete)");
		return handle;
	}

	private static FileAttributeTagInfo ReadAttributeInfo(IntPtr handle)
	{
		FileAttributeTagInfo info;
		if (!GetFileInformationByHandleEx(
			handle,
			FileAttributeTagInfoClass,
			out info,
			(uint)Marshal.SizeOf(typeof(FileAttributeTagInfo))))
		{
			ThrowLastWin32Error("GetFileInformationByHandleEx");
		}
		return info;
	}

	private static void MarkHandleForDeletion(IntPtr handle)
	{
		var disposition = new FileDispositionInfo { DeleteFile = true };
		if (!SetFileInformationByHandle(
			handle,
			FileDispositionInfoClass,
			ref disposition,
			(uint)Marshal.SizeOf(typeof(FileDispositionInfo))))
		{
			ThrowLastWin32Error("SetFileInformationByHandle");
		}
	}

    private static int Run(
        string[] command,
        string workingDirectory,
        string statusPath,
        string stopPath,
        string nonce)
    {
        IntPtr job = IntPtr.Zero;
        ProcessInformation process = new ProcessInformation();
        uint childProcessId = 0;
		bool assignedToJob = false;

        try
        {
            job = CreateJobObject(IntPtr.Zero, null);
            ThrowIfInvalidHandle(job, "CreateJobObjectW");

            var limits = new JobObjectExtendedLimitInformation();
            limits.BasicLimitInformation.LimitFlags = JobObjectLimitKillOnJobClose;
            if (!SetInformationJobObject(
                job,
                JobObjectExtendedLimitInformationClass,
                ref limits,
                (uint)Marshal.SizeOf(typeof(JobObjectExtendedLimitInformation))))
            {
                ThrowLastWin32Error("SetInformationJobObject");
            }

            var startup = new StartupInfo();
            startup.cb = (uint)Marshal.SizeOf(typeof(StartupInfo));
            startup.dwFlags = StartfUseStdHandles;
            startup.hStdInput = GetStdHandle(StdInputHandle);
            startup.hStdOutput = GetStdHandle(StdOutputHandle);
            startup.hStdError = GetStdHandle(StdErrorHandle);

            var commandLine = new StringBuilder(BuildCommandLine(command));
            if (!CreateProcess(
                null,
                commandLine,
                IntPtr.Zero,
                IntPtr.Zero,
                true,
                CreateSuspended,
                IntPtr.Zero,
                workingDirectory,
                ref startup,
                out process))
            {
                ThrowLastWin32Error("CreateProcessW");
            }
            childProcessId = process.dwProcessId;

			IntPtr assignmentJob = Environment.GetEnvironmentVariable("MEDIA_MANAGER_TEST_JOB_FORCE_ASSIGN_FAILURE") == "1"
				? IntPtr.Zero
				: job;
            if (!AssignProcessToJobObject(assignmentJob, process.hProcess))
            {
                ThrowLastWin32Error("AssignProcessToJobObject");
            }
			assignedToJob = true;
			Debug("proceso asignado al Job");

            WriteStatus(statusPath, "ready", nonce, childProcessId, null);
            if (IsStopRequested(stopPath))
            {
                return StopAndConfirm(job, statusPath, nonce, childProcessId, 143);
            }

            if (ResumeThread(process.hThread) == UInt32.MaxValue)
            {
                ThrowLastWin32Error("ResumeThread");
            }
			Debug("proceso reanudado");
            CloseHandle(process.hThread);
            process.hThread = IntPtr.Zero;

            while (true)
            {
                if (IsStopRequested(stopPath))
                {
                    return StopAndConfirm(job, statusPath, nonce, childProcessId, 143);
                }

                uint waitResult = WaitForSingleObject(process.hProcess, PollIntervalMilliseconds);
                if (waitResult == WaitTimeout)
                {
                    continue;
                }
                if (waitResult != WaitObject0)
                {
                    ThrowLastWin32Error("WaitForSingleObject");
                }

                uint rawExitCode;
                if (!GetExitCodeProcess(process.hProcess, out rawExitCode))
                {
                    ThrowLastWin32Error("GetExitCodeProcess");
                }
				Debug("proceso raíz terminado");
                return StopAndConfirm(job, statusPath, nonce, childProcessId, unchecked((int)rawExitCode));
            }
        }
        catch (Exception error)
        {
			Exception reportedError = error;
			if (!assignedToJob && process.hProcess != IntPtr.Zero)
			{
				if (!TerminateProcess(process.hProcess, 1))
				{
					int terminateErrorCode = Marshal.GetLastWin32Error();
					reportedError = new AggregateException(
						error,
						new Win32Exception(
							terminateErrorCode,
							"TerminateProcess falló tras un AssignProcessToJobObject rechazado (Win32 " +
							terminateErrorCode +
							")."));
				}
				else if (WaitForSingleObject(process.hProcess, JobExitTimeoutMilliseconds) != WaitObject0)
				{
					reportedError = new AggregateException(
						error,
						new TimeoutException("El proceso suspendido no confirmó su cierre tras fallar la asignación al Job."));
				}
			}
            if (job != IntPtr.Zero)
            {
                TerminateJobObject(job, 1);
            }
            WriteErrorStatus(statusPath, nonce, childProcessId, reportedError);
            return 1;
        }
        finally
        {
            if (process.hThread != IntPtr.Zero)
            {
                CloseHandle(process.hThread);
            }
            if (process.hProcess != IntPtr.Zero)
            {
                CloseHandle(process.hProcess);
            }
            if (job != IntPtr.Zero)
            {
                CloseHandle(job);
            }
        }
    }

    private static int StopAndConfirm(
        IntPtr job,
        string statusPath,
        string nonce,
        uint childProcessId,
        int exitCode)
    {
        if (!TerminateJobObject(job, unchecked((uint)exitCode)))
        {
            ThrowLastWin32Error("TerminateJobObject");
        }
		Debug("TerminateJobObject confirmado");

        WaitForJobToBecomeEmpty(job);
		Debug("Job vacío");
        WriteStatus(statusPath, "completed", nonce, childProcessId, exitCode);
        return exitCode;
    }

    private static void WaitForJobToBecomeEmpty(IntPtr job)
    {
        DateTime deadline = DateTime.UtcNow.AddMilliseconds(JobExitTimeoutMilliseconds);
        while (true)
        {
            JobObjectBasicAccountingInformation accounting;
            if (!QueryInformationJobObject(
                job,
                JobObjectBasicAccountingInformationClass,
                out accounting,
                (uint)Marshal.SizeOf(typeof(JobObjectBasicAccountingInformation)),
                IntPtr.Zero))
            {
                ThrowLastWin32Error("QueryInformationJobObject");
            }
            if (accounting.ActiveProcesses == 0)
            {
                return;
            }
            if (DateTime.UtcNow >= deadline)
            {
                throw new TimeoutException("El Job Object no quedó vacío dentro del plazo.");
            }
            Thread.Sleep(PollIntervalMilliseconds);
        }
    }

    private static string BuildCommandLine(string[] command)
    {
        var result = new StringBuilder();
        for (int index = 0; index < command.Length; index += 1)
        {
            if (index > 0)
            {
                result.Append(' ');
            }
            result.Append(QuoteArgument(command[index]));
        }
        return result.ToString();
    }

    private static string QuoteArgument(string argument)
    {
        if (argument.Length > 0 && argument.IndexOfAny(new[] { ' ', '\t', '\n', '\v', '"' }) < 0)
        {
            return argument;
        }

        var quoted = new StringBuilder();
        quoted.Append('"');
        int backslashCount = 0;
        foreach (char character in argument)
        {
            if (character == '\\')
            {
                backslashCount += 1;
                continue;
            }
            if (character == '"')
            {
                quoted.Append('\\', backslashCount * 2 + 1);
                quoted.Append('"');
                backslashCount = 0;
                continue;
            }
            quoted.Append('\\', backslashCount);
            backslashCount = 0;
            quoted.Append(character);
        }
        quoted.Append('\\', backslashCount * 2);
        quoted.Append('"');
        return quoted.ToString();
    }

    private static string Decode(string value)
    {
        return Encoding.UTF8.GetString(Convert.FromBase64String(value));
    }

	private static bool IsStopRequested(string stopPath)
	{
		return Environment.GetEnvironmentVariable("MEDIA_MANAGER_TEST_JOB_IGNORE_STOP") != "1" && File.Exists(stopPath);
	}

	private static void Debug(string message)
	{
		if (Environment.GetEnvironmentVariable("MEDIA_MANAGER_TEST_JOB_DEBUG") == "1")
		{
			Console.Error.WriteLine("[windows-test-job {0}ms] {1}", Clock.ElapsedMilliseconds, message);
		}
	}

    private static void WriteStatus(
        string statusPath,
        string state,
        string nonce,
        uint processId,
        int? exitCode)
    {
        string content = state + Environment.NewLine +
            nonce + Environment.NewLine +
            processId.ToString(CultureInfo.InvariantCulture) + Environment.NewLine +
            (exitCode.HasValue ? exitCode.Value.ToString(CultureInfo.InvariantCulture) : String.Empty) + Environment.NewLine +
			(state == "completed" ? "tree-empty" : String.Empty) + Environment.NewLine;
        string temporaryPath = statusPath + ".tmp-" + Guid.NewGuid().ToString("N");
        File.WriteAllText(temporaryPath, content, new UTF8Encoding(false));
        if (File.Exists(statusPath))
        {
            File.Replace(temporaryPath, statusPath, null);
        }
        else
        {
            File.Move(temporaryPath, statusPath);
        }
    }

    private static void WriteErrorStatus(
        string statusPath,
        string nonce,
        uint processId,
        Exception error)
    {
        try
        {
            string encodedError = Convert.ToBase64String(Encoding.UTF8.GetBytes(error.ToString()));
            string content = "error" + Environment.NewLine +
                nonce + Environment.NewLine +
                processId.ToString(CultureInfo.InvariantCulture) + Environment.NewLine +
                encodedError + Environment.NewLine;
            File.WriteAllText(statusPath, content, new UTF8Encoding(false));
        }
        catch
        {
        }
    }

    private static void ThrowIfInvalidHandle(IntPtr handle, string operation)
    {
        if (handle == IntPtr.Zero || handle == new IntPtr(-1))
        {
            ThrowLastWin32Error(operation);
        }
    }

    private static void ThrowLastWin32Error(string operation)
    {
        int errorCode = Marshal.GetLastWin32Error();
        throw new Win32Exception(errorCode, operation + " falló (Win32 " + errorCode + ").");
    }
}
