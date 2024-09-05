import json
from bbl_api.utils import *


sb_items = {}
sb_out_items = {}

bbl_obj = {
    'name': 'bbl_dict',
    'desp': 'backend 全局数据记录, 用于传递信息, 对标 frappe',
    # 't1': 't1',
}


def safe_dict_json_load(d):
    for key, value in d.items():
        try:
            d[key] = json.loads(value)
            safe_dict_json_load(d[key])
        except Exception:
            d[key] = value
    return d


def load_pr_items():
    return safe_dict_json_load(sb_items)


def load_pr_items_0():
    return sb_items


def load_sb_out_items():
    return sb_out_items


""" common utilities """
def safe_json_loads_li(*args):
    results = []

    for arg in args:
        try:
            arg = json.loads(arg)
        except Exception:
            pass
        if arg:
            results.append(arg)
    return results

def safe_json_loads_from_str(arg):
    try:
        arg = json.loads(arg)
    except Exception:
        arg = {}
    return arg



if __name__ == '__main__':
    print_blue_pp(safe_dict_json_load(sb_items))
