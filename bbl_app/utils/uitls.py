import json
from bbl_api.utils import *


sb_items = {'items': '[{"name":"D22401504017","owner":"Administrator","creation":"2024-06-05 17:15:32","modified":"2024-06-05 17:15:32","modified_by":"Administrator","_user_tags":null,"_comments":null,"_assign":null,"_liked_by":null,"docstatus":0,"idx":0,"heat_no":"V22401504","raw_name":"42CrMoA-140","length":7740,"weight":2822,"steel_piece":3,"remaining_piece":3,"remaining_weight":2822,"warehouse":"原钢堆场 - 百兰","status":"未入库","warehouse_area":"南1区","warehouse_area_area_name":"南1区","_idx":5}]', 'cmd': 'bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.pr_send_items'}

sb_out_items = {'semi_product': '06240', 'raw_bar_name': '06240_短棒料', 'bar_ratio': '780', 'bar_piece': '27', 'bar_weight': '9172', 'scrap_length': '1539', 'scrap_weight': '214.9', 'stock_entry': 'MAT-STE-2024-00184', 'bar_batch': 'DBL-20240614-1925-240', 'check_zhxl': '1', 'zh_semi_product': '30BC', 'zh_raw_bar_name': '30BC_短棒料', 'zh_bar_ratio': '805', 'zh_bar_piece': '22', 'zh_bar_weight': '333', 'zh_bar_batch': 'DBL-20240614-1925-240', 'raw_name': '50H-150', 'raw_weight': '9172', 'batchs': '[{"batch_no":"B22421204/0221","weight":9172}]', 'diameter': '150', 'crap_weight': '214.9', 'cmd': 'bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry'}





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
