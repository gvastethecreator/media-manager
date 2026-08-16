param(
	[Parameter(Mandatory = $true)]
	[string]$SourcePath,

	[Parameter(Mandatory = $true)]
	[string]$OutputPath
)

$ErrorActionPreference = 'Stop'

try {
	Add-Type -Path $SourcePath -OutputAssembly $OutputPath -OutputType ConsoleApplication
}
catch {
	Write-Error $_
	exit 1
}
