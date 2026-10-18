import argparse
import json
import sys
from .engine import calculate, InputError
from .feed import generate, publish, current_date

def main():
    parser = argparse.ArgumentParser(description='Věda Célestes offline engine')
    parser.add_argument('command',choices=['chart','feed','serve'])
    parser.add_argument('--date')
    parser.add_argument('--timezone',default='Asia/Kolkata')
    parser.add_argument('--output',default='feeds')
    parser.add_argument('--host',default='127.0.0.1')
    parser.add_argument('--port',type=int,default=8080)
    args = parser.parse_args()
    try:
        if args.command == 'chart':
            result = calculate(json.load(sys.stdin))
        elif args.command == 'feed':
            result = generate(args.date or current_date(args.timezone),args.timezone)
            publish(result,args.output)
        else:
            from .service import serve
            serve(args.output,args.timezone,args.port,args.host)
            return
        print(json.dumps(result,ensure_ascii=False,allow_nan=False))
    except (InputError,ValueError) as exc:
        print(json.dumps({'error':{'code':'INVALID_INPUT','message':str(exc)}}),file=sys.stderr)
        sys.exit(2)
    except Exception:
        print(json.dumps({'error':{'code':'CALCULATION_FAILED','message':'Calculation failed; previous feed retained.'}}),file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
