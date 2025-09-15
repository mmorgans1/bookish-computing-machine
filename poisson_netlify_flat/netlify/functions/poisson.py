import json
from poisson_models import run_poisson_model

def handler(event, context):
    body = json.loads(event["body"])
    sport = body.get("sport")
    kwargs = {k: v for k, v in body.items() if k != "sport"}
    try:
        result = run_poisson_model(sport, **kwargs)
        return {"statusCode": 200, "body": json.dumps(result)}
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
