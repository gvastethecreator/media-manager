// Funciones para gestionar el backend integrado
use tauri::Manager;

#[tauri::command]
pub async fn check_backend_health() -> Result<String, String> {
    match reqwest::get("http://localhost:3001/health").await {
        Ok(response) => {
            if response.status().is_success() {
                Ok("Backend is running".to_string())
            } else {
                Err("Backend is not responding".to_string())
            }
        }
        Err(_) => Err("Cannot connect to backend".to_string()),
    }
}

#[tauri::command]
pub async fn get_app_data_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    Ok(app_data_dir.to_string_lossy().to_string())
}
