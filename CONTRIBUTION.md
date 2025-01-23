
# Contributing to Chatbot LLM

We welcome contributions to the Chatbot LLM project! By contributing, you will help enhance the functionality of the app and make it more useful to everyone. Below are the steps and guidelines to ensure smooth collaboration.

## Setting Up the Project

Please follow the setup instructions in the [README.md](README.md) to get started with the project.

Once you have set up the project locally, feel free to explore the code and start contributing!

### Set Up Environment Variables

Before running the application, you need to set up the environment variables.

1. **Copy the `.env.example` file to create a new `.env` file**:
    ```bash
    cp .env.example .env
    ```
2. **Configure the necessary environment variables** for Google Auth, database connection, and other configurations by editing the `.env` file.

### Prisma Commands

To set up the database and ensure everything works smoothly, you will need to run the following Prisma commands.

1. **Run database migrations**:
    ```bash
    pnpm run migrate:postgres
    ```
2. **Seed the database** (optional, if your project requires initial data):
    ```bash
    pnpm run seed:db
    ```

These commands will ensure that your database is set up correctly, and any necessary initial data is populated.

## How to Contribute

1. **Fork the repository**: Create a fork of this repository to your own GitHub account.
2. **Create a branch**: Create a new branch for your changes. Use descriptive names such as:
   - `fix:<issue-number>-<description>`
   - `feat:<new-feature-name>`
3. **Make your changes**: Implement your changes to the code.
4. **Commit your changes**: Make clear and descriptive commits with the following prefixes:
   - `fix:` for bug fixes
   - `feat:` for new features or improvements
5. **Push your changes**: Push your changes to your forked repository.
6. **Create a Pull Request (PR)**: Go to the original repository and open a Pull Request with a clear description of what your PR does.

---

## PR Format

When creating a PR, please follow this format:

```
fix: Fix issue where user login fails due to API error

feat: Add functionality to support multiple LLM providers (e.g., Ollama, OpenAI)

## What does this PR do?

Explain what changes are being made, the reasoning behind those changes, and what problem they solve.

## How to test this?

Describe how to test the changes (e.g., steps for testing or screenshots if applicable).

## Any related issues or PRs?

List any issues or PRs that this PR addresses or is related to.
```

## Best Practices for PRs

1. **Ensure your changes are aligned with the project's coding style**.
2. **Add tests where necessary**.
3. **Be clear and concise in your PR description**.
4. **Avoid sharing sensitive information in your PR** (e.g., API keys, passwords).

## LLM Customization

Feel free to use any LLM service that suits your needs. Ollama is used in this project by default, but you can switch to another provider or service if desired.

Thank you for contributing! Together, we can make this project even better.
```

---
