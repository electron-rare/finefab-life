import shutil
import subprocess
import unittest
from pathlib import Path


class TestComposeSmoke(unittest.TestCase):
    def test_compose_file_exists(self) -> None:
        self.assertTrue(Path("docker-compose.yml").exists(), "docker-compose.yml is required")

    def test_compose_config_is_valid(self) -> None:
        if shutil.which("docker") is None:
            self.skipTest("docker command not available")
        result = subprocess.run(
            ["docker", "compose", "-f", "docker-compose.yml", "config", "--quiet"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(
            result.returncode,
            0,
            msg=f"docker compose config failed:\n{result.stderr}",
        )


if __name__ == "__main__":
    unittest.main()
