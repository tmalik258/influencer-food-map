class PipelineError(Exception):
    def __init__(self, error_type: str, message: str, details: dict | None = None):
        super().__init__(message)
        self.error_type = error_type
        self.details = details or {}

    def __str__(self):
        return f"{self.error_type}: {super().__str__()}"