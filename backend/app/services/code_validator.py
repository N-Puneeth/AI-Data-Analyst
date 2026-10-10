"""Code validation service — AST-based checks on AI-generated Python code."""

import ast
import re
from typing import Optional


# Libraries allowed in the E2B sandbox
ALLOWED_IMPORTS = {
    "pandas", "pd", "numpy", "np", "matplotlib", "matplotlib.pyplot", "plt",
    "seaborn", "sns", "scipy", "sklearn", "scikit-learn",
    "math", "statistics", "collections", "itertools", "functools",
    "json", "csv", "io", "re", "datetime", "time", "textwrap",
    "warnings", "typing", "dataclasses",
}

# Dangerous module patterns
BLOCKED_MODULES = {
    "os", "sys", "subprocess", "shutil", "pathlib",
    "socket", "http", "urllib", "requests", "httpx",
    "importlib", "ctypes", "multiprocessing", "threading",
    "signal", "pickle", "shelve", "tempfile",
    "builtins", "__builtin__",
}

# Dangerous function calls
BLOCKED_CALLS = {
    "exec", "eval", "compile", "__import__",
    "open",  # except for data file paths
    "exit", "quit",
}


class CodeValidationError(Exception):
    """Raised when generated code fails validation."""
    pass


def validate_python_code(code: str, dataset_path: Optional[str] = None) -> str:
    """
    Validate AI-generated Python code for safety.
    Returns the code if valid, raises CodeValidationError if not.
    """
    if not code or not code.strip():
        raise CodeValidationError("Empty code block received from AI.")

    # Check code length (reasonable limit)
    if len(code) > 50_000:
        raise CodeValidationError("Generated code exceeds maximum allowed length.")

    # Try to parse the AST
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise CodeValidationError(f"Syntax error in generated code: {e}")

    # Walk the AST to check for dangerous patterns
    for node in ast.walk(tree):
        # Check imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                _check_import(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                _check_import(node.module)

        # Check function calls
        elif isinstance(node, ast.Call):
            func_name = _get_call_name(node)
            if func_name in BLOCKED_CALLS:
                # Allow open() only for the dataset file
                if func_name == "open" and dataset_path:
                    continue
                raise CodeValidationError(
                    f"Blocked function call: '{func_name}' is not allowed."
                )

    return code


def extract_code_from_response(raw_text: str) -> str:
    """Extract Python code from AI response (markdown code blocks or raw)."""
    # Try to find ```python ... ``` blocks
    code_matches = re.findall(
        r'```(?:python)?\s*(.*?)```',
        raw_text,
        re.DOTALL | re.IGNORECASE,
    )
    if code_matches:
        # Join multiple code blocks
        extracted = "\n\n".join(block.strip() for block in code_matches)
        return extracted

    # Fallback: treat entire response as code (strip markdown filler)
    lines = raw_text.strip().split("\n")
    code_lines = [
        line for line in lines
        if not line.startswith("#") or line.startswith("# ") or line.startswith("import")
    ]
    return "\n".join(code_lines).strip()


def _check_import(module_name: str) -> None:
    """Check if a module import is allowed."""
    top_module = module_name.split(".")[0]
    if top_module in BLOCKED_MODULES:
        raise CodeValidationError(
            f"Blocked import: '{module_name}' is not allowed for security reasons."
        )


def _get_call_name(node: ast.Call) -> str:
    """Extract the function name from a Call node."""
    if isinstance(node.func, ast.Name):
        return node.func.id
    elif isinstance(node.func, ast.Attribute):
        return node.func.attr
    return ""

