import os
import django
import unittest
from datetime import datetime

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "MyApp.settings")
django.setup()

from MyApp._TestCode import *

test_classes = [
    obj for name, obj in globals().items()
    if isinstance(obj, type) and issubclass(obj, unittest.TestCase)
]

def run_all_tests(output_file="test_results.txt"):
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"Test run: {datetime.now().isoformat()}\n\n")
        loader = unittest.TestLoader()
        for test_class in test_classes:
            f.write(f"\n=== Running tests in {test_class.__name__} ===\n\n")
            suite = loader.loadTestsFromTestCase(test_class)
            runner = unittest.TextTestRunner(stream=f, verbosity=2)
            runner.run(suite)

if __name__ == "__main__":
    run_all_tests()
