from __future__ import annotations

import abc
import json
from pathlib import Path


class IDecisionTreeRepository(abc.ABC):
    @abc.abstractmethod
    def get(self, id):
        raise NotImplementedError

    @abc.abstractmethod
    def save(self, decision_tree):
        raise NotImplementedError

    @abc.abstractmethod
    def delete(self, id):
        raise NotImplementedError

    @abc.abstractmethod
    def list(self):
        raise NotImplementedError


class JsonDecisionTreeRepository(IDecisionTreeRepository):
    def __init__(self, data_dir: Path | str) -> None:
        self._data_dir = Path(data_dir)

    def _path(self, id: str) -> Path:
        return self._data_dir / f"{id}.json"

    def get(self, id):
        path = self._path(id)
        if not path.exists():
            return None
        return json.loads(path.read_text())

    def save(self, decision_tree):
        self._data_dir.mkdir(parents=True, exist_ok=True)
        requirement_id = decision_tree["decisionTree"]["requirementId"]
        self._path(requirement_id).write_text(json.dumps(decision_tree, indent=2))

    def delete(self, id):
        self._path(id).unlink(missing_ok=True)

    def list(self):
        if not self._data_dir.exists():
            return []
        return sorted(path.stem for path in self._data_dir.glob("*.json"))
