"""
Phase 3 Evaluation Report Runner and Executive Benchmark Presentation (PS 26081).
Outputs formatted scorecards, skill gain calculations, and categorical contingency tables.
"""
import argparse
import pandas as pd
from evaluator import ForecastEvaluator


def print_executive_report(eval_results: dict):
    summary_df = eval_results["summary"]
    contingency_df = eval_results["contingency"]

    print("\n" + "=" * 80)
    print("      PHASE 3: METEOROLOGICAL FORECAST VERIFICATION & BENCHMARK REPORT      ")
    print("      Hybrid AI-NWP Blending System vs Standalone Models (PS 26081)         ")
    print("=" * 80)

    # 1. Summary by Variable
    for var in summary_df["variable"].unique():
        var_sub = summary_df[summary_df["variable"] == var].sort_values("rmse")
        best_nwp = var_sub["best_standalone_benchmark"].iloc[0]
        
        print(f"\n--- VARIABLE: {var.upper()} ---")
        print(f"{'Model':22s} | {'Type':16s} | {'RMSE':7s} | {'MAE':7s} | {'Bias':7s} | {'Corr (R)':8s} | {'Skill Gain vs Best':18s}")
        print("-" * 95)

        for _, row in var_sub.iterrows():
            m_name = row["model"]
            m_type = row["model_type"]
            rmse_str = f"{row['rmse']:.3f}"
            mae_str = f"{row['mae']:.3f}"
            bias_str = f"{row['bias']:+.3f}"
            corr_str = f"{row['correlation']:.3f}"
            
            ss = row["skill_score_vs_best_nwp"]
            if row["model"] == "blend_hybrid_ml":
                ss_str = f"[*] {ss:+.1f}% (HYBRID)"
            elif ss > 0:
                ss_str = f"+{ss:.1f}%"
            elif ss == 0 and row["model"] == best_nwp:
                ss_str = "0.0% (Best Standalone)"
            else:
                ss_str = f"{ss:.1f}%"

            marker = ">> " if "blend" in m_name else "   "
            print(f"{marker}{m_name:19s} | {m_type:16s} | {rmse_str:7s} | {mae_str:7s} | {bias_str:7s} | {corr_str:8s} | {ss_str:18s}")

        # Highlight Skill Gain
        hybrid_row = var_sub[var_sub["model"] == "blend_hybrid_ml"]
        if not hybrid_row.empty:
            h_rmse = hybrid_row["rmse"].iloc[0]
            best_nwp_row = var_sub[var_sub["model"] == best_nwp]
            if not best_nwp_row.empty:
                b_rmse = best_nwp_row["rmse"].iloc[0]
                reduction = ((b_rmse - h_rmse) / b_rmse) * 100.0
                print(f"\n  [KEY METRIC] Hybrid AI-NWP Blend achieved {reduction:.1f}% RMSE reduction over best standalone model ({best_nwp})")

    # 2. Extreme Weather Contingency Table
    if not contingency_df.empty:
        print("\n" + "=" * 80)
        print("                 EXTREME WEATHER DETECTION SKILL (CONTINGENCY)               ")
        print("=" * 80)
        print(f"{'Hazard Event':32s} | {'Model':18s} | {'Hits':5s} | {'False Alarms':12s} | {'Hit Rate (POD)':14s} | {'False Alarm (FAR)':17s} | {'Threat (CSI)':12s}")
        print("-" * 115)

        for _, row in contingency_df.iterrows():
            pod_str = f"{row['pod_hit_rate']*100:.1f}%"
            far_str = f"{row['far_false_alarm_ratio']*100:.1f}%"
            csi_str = f"{row['csi_threat_score']*100:.1f}%"
            print(f"{row['hazard_label']:32s} | {row['model']:18s} | {row['hits']:5d} | {row['false_alarms']:12d} | {pod_str:14s} | {far_str:17s} | {csi_str:12s}")

    print("\n" + "=" * 80)
    print("                     END OF PHASE 3 EVALUATION REPORT                       ")
    print("=" * 80 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Phase 3 Forecast Evaluation Runner (PS 26081)")
    parser.add_argument("--run", action="store_true", help="Execute complete forecast verification and generate report")
    args = parser.parse_args()

    evaluator = ForecastEvaluator()
    results = evaluator.run_full_evaluation()
    print_executive_report(results)


if __name__ == "__main__":
    main()
