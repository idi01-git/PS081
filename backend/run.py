"""
Unified Command-Line Runner for Hybrid AI-NWP System (PS 26081).
Provides single-entry-point orchestration for ingestion, blending, evaluation, testing, and audits.
"""
import sys
import argparse
import unittest
from pathlib import Path

# Add src/ to Python search path
SRC_DIR = Path(__file__).resolve().parent / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))


def run_pipeline(days: int = 7):
    print(">>> [RUNNER] 1. INGESTING LIVE FORECASTS & HISTORICAL GROUND TRUTH <<<")
    from pipeline import Phase1DataPipeline
    pipeline = Phase1DataPipeline()
    pipeline.run_live_forecast_ingestion()
    pipeline.run_historical_observations_ingestion(days_back=days)
    pipeline.print_pipeline_summary()


def run_blending():
    print(">>> [RUNNER] 2. EXECUTING HYBRID AI-NWP BLENDING ENGINE <<<")
    from blending_engine import HybridBlendingEngine
    engine = HybridBlendingEngine()
    results = engine.run_blending()
    engine.print_blending_report(results)


def run_evaluation():
    print(">>> [RUNNER] 3. RUNNING FORECAST EVALUATION & BENCHMARKING <<<")
    from evaluator import ForecastEvaluator
    from evaluation_report import print_executive_report
    evaluator = ForecastEvaluator()
    results = evaluator.run_full_evaluation()
    print_executive_report(results)


def run_tests():
    print(">>> [RUNNER] 4. EXECUTING AUTOMATED UNIT & INTEGRATION TESTS <<<")
    tests_dir = Path(__file__).resolve().parent / "tests"
    loader = unittest.TestLoader()
    suite = loader.discover(str(tests_dir), pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


def run_audit():
    print(">>> [RUNNER] 5. RUNNING DEEP CROSS-PHASE QUALITY AUDIT <<<")
    audits_dir = Path(__file__).resolve().parent / "audits"
    if str(audits_dir) not in sys.path:
        sys.path.insert(0, str(audits_dir))
    from deep_audit import run_deep_audit
    return run_deep_audit()


def run_api(host: str = "127.0.0.1", port: int = 8000):
    print(f">>> [RUNNER] STARTING FASTAPI BACKEND SERVER (http://{host}:{port}) <<<")
    import uvicorn
    uvicorn.run("api:app", host=host, port=port, reload=True)


def main():
    parser = argparse.ArgumentParser(description="Master CLI Runner for PS 26081 Hybrid AI-NWP Blending System")
    parser.add_argument("--ingest", action="store_true", help="Ingest live forecasts and historical observations")
    parser.add_argument("--days", type=int, default=7, help="Number of historical days for baseline (default: 7)")
    parser.add_argument("--blend", action="store_true", help="Run multi-model blending and adaptive weight learning")
    parser.add_argument("--evaluate", action="store_true", help="Compute verification metrics (RMSE, MAE, Skill Score)")
    parser.add_argument("--test", action="store_true", help="Run full automated unit & integration test suite")
    parser.add_argument("--audit", action="store_true", help="Run cross-phase data integrity & bounds audit")
    parser.add_argument("--api", action="store_true", help="Launch FastAPI server for frontend integration")
    parser.add_argument("--all", action="store_true", help="Run full pipeline end-to-end (ingest, blend, evaluate, audit)")

    args = parser.parse_args()

    if len(sys.argv) == 1 or args.all:
        run_pipeline(days=args.days)
        run_blending()
        run_evaluation()
        run_tests()
        run_audit()
    else:
        if args.ingest:
            run_pipeline(days=args.days)
        if args.blend:
            run_blending()
        if args.evaluate:
            run_evaluation()
        if args.test:
            run_tests()
        if args.audit:
            run_audit()
        if args.api:
            run_api()


if __name__ == "__main__":
    main()
