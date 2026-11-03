import os
import json
import hashlib
import time
from typing import Dict, Any, List, Optional

REGISTRY_PATH = "/Users/srijan/aiproctor/ai/training/artifacts/model_registry.json"

def compute_file_checksum(filepath: str) -> str:
    """Computes SHA256 checksum for model artifact verification."""
    if not os.path.exists(filepath):
        return "artifact_file_missing"
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

class ModelRegistry:
    def __init__(self, registry_file: str = REGISTRY_PATH):
        self.registry_file = registry_file
        os.makedirs(os.path.dirname(self.registry_file), exist_ok=True)
        self.models = self._load()

    def _load(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.registry_file):
            return []
        try:
            with open(self.registry_file, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _save(self):
        with open(self.registry_file, "w") as f:
            json.dump(self.models, f, indent=2)

    def register_model(
        self,
        model_identifier: str,
        version: str,
        dataset_version: str,
        artifact_path: str,
        training_config: Dict[str, Any],
        evaluation_metrics: Dict[str, Any],
        is_active: bool = False,
    ) -> Dict[str, Any]:
        checksum = compute_file_checksum(artifact_path)
        entry = {
            "model_identifier": model_identifier,
            "version": version,
            "dataset_version": dataset_version,
            "artifact_path": artifact_path,
            "artifact_checksum": checksum,
            "training_config": training_config,
            "evaluation_metrics": evaluation_metrics,
            "registered_at": time.time(),
            "registered_at_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "active" if is_active else "staged",
        }

        if is_active:
            for m in self.models:
                if m["model_identifier"] == model_identifier:
                    m["status"] = "archived"

        self.models.append(entry)
        self._save()
        return entry

    def list_models(self, model_identifier: Optional[str] = None) -> List[Dict[str, Any]]:
        if model_identifier:
            return [m for m in self.models if m["model_identifier"] == model_identifier]
        return self.models

    def get_active_model(self, model_identifier: str) -> Optional[Dict[str, Any]]:
        for m in reversed(self.models):
            if m["model_identifier"] == model_identifier and m["status"] == "active":
                return m
        return None

    def promote_model(self, model_identifier: str, target_version: str) -> bool:
        found = False
        for m in self.models:
            if m["model_identifier"] == model_identifier:
                if m["version"] == target_version:
                    m["status"] = "active"
                    found = True
                else:
                    m["status"] = "archived"
        if found:
            self._save()
        return found

    def rollback_model(self, model_identifier: str, target_version: str) -> bool:
        """Rollback to a previously approved model version."""
        return self.promote_model(model_identifier, target_version)

registry = ModelRegistry()

if __name__ == "__main__":
    print(f"Model Registry loaded at: {REGISTRY_PATH}")
    print(f"Total registered models: {len(registry.list_models())}")

