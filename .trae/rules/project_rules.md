# Trae Project Rules

This document outlines the strict rules and guidelines for running the **Nomtok** project, ensuring consistent port usage and proper backend management. Use Docker for backend.

---

## Frontend Rules

- **Package Manager:** `pnpm`
- **Primary Port:** `3000`
- **Policy:**  
  - The frontend **must always run on port 3000**.  
  - If port 3000 is occupied, **do not** automatically switch to another port.
  - Instead:
    1. Check if another terminal or process is already running the Trae frontend on port 3000.
    2. Terminate or reuse the existing process as needed.
  - **Under no circumstances** should any other port be used for the frontend.

---

## Backend Rules

- **Port:** `8030`
- **Environment:** Runs inside a **Docker container**.
- Do not run fastapi directly, it should be run inside the docker container.

### Checking Backend Status

- Use the following command to check if the backend is running:

```bash
  dclogs backend
```

### Starting the Backend

- If the backend is **not running**, start it with:

  ```bash
  dcu
  ```

### Restarting the Backend

- To restart the **entire Docker stack**, use:

    ```bash
    dcr
    ```

- To restart **only the backend container**, use:

  ```bash
  dcr backend
  ```

### Executing container commands

- To execute a command inside the backend container, use:

  ```bash
  dce backend <command>
  ```

  For example, to run a shell inside the backend container:

  ```bash
  dce backend bash
  ```

  or to run alembic migrations:

  ```bash
  dce backend alembic revision --autogenerate -m "Add new column"
  dce backend alembic upgrade head
  ```

---

## Summary of Commands

| Action                   | Command          |
| ------------------------ | ---------------- |
| Check backend logs       | `dclogs backend` |
| Start backend if stopped | `dcu`            |
| Restart all containers   | `dcr`            |
| Restart backend only     | `dcr backend`    |

---

## Important Notes

- **Never modify the ports** specified above for any reason.
- Ensure Docker is running before executing the commands.
- Always verify the backend status before attempting to start or restart it.
