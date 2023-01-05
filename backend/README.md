# Prepation of development environment
```bash
python -m venv ./.venv
. ./.venv/bin/activate
pip install pip-tools
ci/install_dependencies.sh

git submodule update --init --recursive
```

# Updating dependencies
After you change a dependency in `dev-requirements.in` or `requirements.in` you can update the pinned
dependencies in `dev-requirements.txt` and `requirements.txt` with:
```bash
ci/update_dependencies.h
```

Finally, to install the new or updated dependencies:
```bash
ci/install_dependencies.sh
```

# Development tooling
To unit test:
```bash
ci/test_unit.sh
```

To typecheck:
```bash
ci/typecheck.sh
```

# Run the backend
To run the backend locally:
```bash
./run.sh
```