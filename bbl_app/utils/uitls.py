import json
from frappe.utils import safe_json_loads
from bbl_api.utils import *


sb_items = {'items': '[{"name":"D12402467029","owner":"Administrator","creation":"2024-06-01 11:52:35","modified":"2024-06-01 11:52:35","modified_by":"Administrator","_user_tags":null,"_comments":null,"_assign":null,"_liked_by":null,"docstatus":0,"idx":0,"heat_no":"V12402467","raw_name":"42CrMoA-130","length":7044,"weight":2962,"steel_piece":3,"remaining_piece":3,"remaining_weight":2962,"warehouse":"原钢堆场 - 百兰","status":"未入库","warehouse_area":"南1区","warehouse_area_area_name":"南1区","_idx":1},{"name":"D12402467028","owner":"Administrator","creation":"2024-06-01 11:52:29","modified":"2024-06-01 11:52:29","modified_by":"Administrator","_user_tags":null,"_comments":null,"_assign":null,"_liked_by":null,"docstatus":0,"idx":0,"heat_no":"V12402467","raw_name":"42CrMoA-150","length":7044,"weight":2962,"steel_piece":3,"remaining_piece":3,"remaining_weight":2962,"warehouse":"原钢堆场 - 百兰","status":"未入库","warehouse_area":"南1区","warehouse_area_area_name":"南1区","_idx":2},{"name":"D12402467027","owner":"Administrator","creation":"2024-06-01 11:52:23","modified":"2024-06-01 11:52:23","modified_by":"Administrator","_user_tags":null,"_comments":null,"_assign":null,"_liked_by":null,"docstatus":0,"idx":0,"heat_no":"V12402467","raw_name":"42CrMoA-150","length":7044,"weight":2962,"steel_piece":3,"remaining_piece":3,"remaining_weight":2962,"warehouse":"原钢堆场 - 百兰","status":"未入库","warehouse_area":"南1区","warehouse_area_area_name":"南1区","_idx":3},{"name":"B22421204/0223","owner":"Administrator","creation":"2024-06-01 11:52:15","modified":"2024-06-01 11:52:15","modified_by":"Administrator","_user_tags":null,"_comments":null,"_assign":null,"_liked_by":null,"docstatus":0,"idx":0,"heat_no":"24701925","raw_name":"50H-150","length":7560,"weight":3172,"steel_piece":3,"remaining_piece":3,"remaining_weight":3172,"warehouse":"原钢堆场 - 百兰","status":"未入库","warehouse_area":"南1区","warehouse_area_area_name":"南1区","_idx":4},{"name":"B22421204/0222","owner":"Administrator","creation":"2024-06-01 11:52:08","modified":"2024-06-01 11:52:08","modified_by":"Administrator","_user_tags":null,"_comments":null,"_assign":null,"_liked_by":null,"docstatus":0,"idx":0,"heat_no":"24701925","raw_name":"50H-150","length":7560,"weight":7172,"steel_piece":3,"remaining_piece":3,"remaining_weight":7172,"warehouse":"原钢堆场 - 百兰","status":"未入库","warehouse_area":"南1区","warehouse_area_area_name":"南1区","_idx":5}]', 'cmd': 'bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.pr_send_items'}

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
    
    
    
    
    
    
if __name__ == '__main__':
    print_blue_pp(safe_dict_json_load(sb_items))
