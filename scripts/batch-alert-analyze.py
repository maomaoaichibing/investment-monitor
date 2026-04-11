#!/usr/bin/env python3
"""批量分析所有未读 high/medium alerts"""
import subprocess
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict

BASE_URL = "http://62.234.79.188:4000"

def analyze_alert(alert_id):
    cmd = f'curl -s -X POST "{BASE_URL}/api/alerts/{alert_id}/analyze"'
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
        data = json.loads(result.stdout)
        if data.get('success') and data.get('data'):
            d = data['data']
            ir = d.get('impactResult') or {}
            return {
                'alertId': d.get('alertId'),
                'symbol': d.get('symbol'),
                'assetName': d.get('assetName'),
                'impactDirection': ir.get('impactDirection'),
                'impactScore': ir.get('impactScore'),
                'assumptionStatus': ir.get('assumptionStatus'),
                'newHealthScore': ir.get('newHealthScore'),
                'healthScoreChange': ir.get('healthScoreChange'),
                'suggestedAction': ir.get('suggestedAction'),
                'analyzedAt': d.get('analyzedAt'),
                'error': None
            }
        return {'alertId': alert_id, 'error': data.get('error', 'Unknown')}
    except Exception as e:
        return {'alertId': alert_id, 'error': str(e)}

# Get all unread alerts
print("Fetching unread alerts...")
cmd = f'curl -s "{BASE_URL}/api/alerts?status=unread&level=important,urgent"'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
data = json.loads(result.stdout)
alerts = data['data']['alerts']
total = data['data']['total']
print(f"Found {total} unread alerts")

alert_ids = [a['id'] for a in alerts]

# Parallel analysis
results = []
done = 0
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(analyze_alert, aid): aid for aid in alert_ids}
    for future in as_completed(futures):
        done += 1
        r = future.result()
        results.append(r)
        if r.get('error'):
            print(f"[{done}/{len(alert_ids)}] FAIL {r['alertId'][:20]}: {r['error']}")
        else:
            print(f"[{done}/{len(alert_ids)}] OK {r['symbol']} ({r['assetName']}): {r['impactDirection']} ({r['impactScore']}/10) | {r['assumptionStatus']}")

# Group by symbol
by_symbol = defaultdict(list)
for r in results:
    if not r.get('error'):
        by_symbol[r['symbol']].append(r)

print("\n" + "="*60)
print("ANALYSIS SUMMARY")
print("="*60)

for symbol, rs in sorted(by_symbol.items(), key=lambda x: -len(x[1])):
    bullish = sum(1 for r in rs if r['impactDirection'] == 'bullish')
    bearish = sum(1 for r in rs if r['impactDirection'] == 'bearish')
    neutral = sum(1 for r in rs if r['impactDirection'] == 'neutral')
    avg_score = sum(r['impactScore'] for r in rs) / len(rs) if rs else 0
    changes = [r['healthScoreChange'] for r in rs if r['healthScoreChange']]
    total_change = sum(changes) if changes else 0
    print(f"\n{symbol} ({rs[0]['assetName']}): {len(rs)} alerts")
    print(f"  Direction: bullish={bullish} bearish={bearish} neutral={neutral}")
    print(f"  Avg Impact Score: {avg_score:.1f}/10")
    print(f"  Health Score Change: {'+' if total_change >= 0 else ''}{total_change}")

total_analyzed = sum(len(rs) for rs in by_symbol.values())
errors = [r for r in results if r.get('error')]
print(f"\nAnalyzed: {total_analyzed}/{len(alert_ids)}, Errors: {len(errors)}")

# Save report
report = {
    'total': total,
    'analyzed': total_analyzed,
    'errors': len(errors),
    'by_symbol': {sym: [{'alertId': r['alertId'], 'direction': r['impactDirection'],
        'score': r['impactScore'], 'status': r['assumptionStatus'],
        'healthChange': r['healthScoreChange'], 'action': r['suggestedAction']}
        for r in rs] for sym, rs in by_symbol.items()}
}
with open('/tmp/alert_analysis_report.json', 'w') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print("\nReport saved to /tmp/alert_analysis_report.json")