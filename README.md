# CapitalSense Decision Studio

CapitalSense Decision Studio is a financial decision-support project with two application surfaces:

- A Next.js web app in `apps/web`
- A Streamlit app launched from `app.py`

## Live website

[Open Paisaan Decision Studio](https://paisaan-decision-studio.shubhamtejani9.workers.dev)

The production website is deployed on Cloudflare Workers. The URL is permanent and does not depend on a local computer or temporary tunnel.

## Product direction and implementation history

The living source of truth for the product vision, user outcomes, feature consolidation, roadmap, release criteria, and version-by-version code history is the [Paisaan Implementation Tracker](./IMPLEMENTATION_TRACKER.md).

Update the tracker with every product increment so implementation decisions and completed work remain visible across devices, contributors, and future Codex tasks.

## Local setup

### Next.js app

Use Node.js 20.9 or newer, then run:

```bash
npm ci
npm run dev
```

Quality checks:

```bash
npm run release:check
```

Production deployment requirements, automated gates, runtime contracts, and unresolved launch decisions are tracked in [Production readiness](./docs/PRODUCTION_READINESS.md).

### Streamlit app

Create and activate a Python virtual environment, then run:

```bash
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

Run the Python tests with:

```bash
python -m pytest -q
```

## Working from ChatGPT on any computer

The GitHub repository is the source of truth. In ChatGPT or Codex, create a Codex Cloud environment, connect this repository, and let the environment install the dependencies above. Cloud tasks use their own workspaces, so they do not depend on the original laptop remaining online.

For each change, ask ChatGPT to implement and test the work, review the diff, then commit or open a pull request. Merge accepted changes into the default branch so every device sees the same current project.

Do not commit API keys or passwords. Add required credentials through the cloud environment's secrets or environment-variable settings.
