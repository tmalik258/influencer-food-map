Here’s a Markdown document with clear project rules for **Trae** based on your requirements:

````markdown
# Trae Project Rules

This document outlines the strict rules and guidelines for running the **Trae** project, ensuring consistent port usage and proper backend management.

---

## Frontend Rules

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

### Checking Backend Status
- Use the following command to check if the backend is running:
  ```bash
  dclogs backend
````

### Starting the Backend

* If the backend is **not running**, start it with:

  ```bash
  dcu
  ```

### Restarting the Backend

* To restart the **entire Docker stack**, use:

    ```bash
    dcr
    ```

* To restart **only the backend container**, use:

  ```bash
  dcr backend
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

* **Never modify the ports** specified above for any reason.
* Ensure Docker is running before executing the commands.
* Always verify the backend status before attempting to start or restart it.
