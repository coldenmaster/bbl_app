# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

# import frappe
import json
from bbl_app.utils.uitls import safe_json_loads_from_str
from erpnext.manufacturing.doctype.work_order.work_order import make_work_order, make_stock_entry
import frappe
from frappe.model.document import Document
from frappe.utils.data import cint

from bbl_api.utils import _print_green_pp, print_blue, print_blue_pp, print_green, print_green_pp, print_red, print_yellow


class ShortRawBar(Document):
    pass

    def on_trash(self):
        print_red("srb on_trash")
        print_red(frappe.session.user)
        if ("Administrator" != frappe.session.user ):
            frappe.throw("只有管理员才能删除此文档")





up_obj_mock = {}
# up_obj_mock = {'semi_product': '30BC', 'items': '[{"name":"DBL-30BC-24011462Z","owner":"xiezequan@hbbbl.top","creation":"2024-07-03 16:13:04","modified":"2024-07-03 16:13:04","modified_by":"xiezequan@hbbbl.top","_user_tags":null,"_comments":null,"_assign":null,"_liked_by":null,"docstatus":0,"idx":0,"raw_bar_name":"30BC_短棒料","heat_no":"V12403619","in_piece":160,"remaining_piece":160,"wip_piece":0,"accu_piece":160,"status":"未使用","_comment_count":0,"_idx":2}]', 'cmd': 'bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar.product_out'}

""" 短棒料 建生产工单部分 """
# http://dev2.localhost:8000/api/method/bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar.product_out?scan_barcode=123
@frappe.whitelist()
def product_out(**kwargs):
    print_red("srb product_out")
    # print_blue(kwargs)
    if not kwargs:
        print_red("mock data 😁")
        kwargs = up_obj_mock #置入假数据
    up_obj = frappe._dict(kwargs)
    items = json.loads(up_obj.get("items"))
    if len(items) == 0:
        frappe.throw("没有出库数据")
    # print_red(up_obj)
    # print_green_pp(up_obj.get("items"))

    # 1.求取需要的数据
    semi_product = up_obj.get("semi_product")
    t_item_name = semi_product + "_锻坯登记"
    item = frappe._dict(items[0])
    # print_blue_pp(item)
    
    s_item_name = item.raw_bar_name
    s_piece = sum([i.get("remaining_piece") for i in items])
    batch_qtys = [(i.get("name"), i.get("remaining_piece"))for i in items]

    # 2.自动建立需要的文档
    # -1.建Item
    item_doc = create_item(t_item_name)
    # -2.建bom
    bom_doc = create_bom(s_item_name, t_item_name)
    # -3.生产工单
    wo_warehouse = "锻造车间仓库 - 百兰"
    wo_doc = create_work_order(bom_doc.name, t_item_name, s_piece, wo_warehouse, wo_warehouse)
    # -4.建生产发料单
    # -4.1 建生产批次组sabb
    bar_sabb_name = create_bar_sabb(s_item_name, s_piece, batch_qtys)
    se_doc = create_stock_entry(wo_doc.name, bar_sabb_name)

    # 3.全部单据创建-提交完成，修改短棒料的状态为‘锻造车间wip’
    adjust_short_bar_status(batch_qtys, wo_doc.name)
        # frappe.set_value("Short Raw Bar", batch_qty[0], "remaining_piece", 0)
    
    # 4.记录操作流水(此处记录多少短棒料转移到锻造车间wip)
    create_op_flow(batch_qtys, item, se_doc.name, s_item_name)

    # over 提交数据库保存
    frappe.db.commit()
    frappe.msgprint("完成短棒料" + frappe.bold("工单发料"), indicator="green", alert=True)
    return wo_doc.name

def create_item(item_name, item_type = '过程半成品'):
    if (not frappe.db.exists('Item', item_name)):
        new_doc = frappe.get_doc({
            'doctype': 'Item',
            'item_code': item_name,
            "item_group": item_type,
            "stock_uom": "根",
            'has_batch_no': 1,
            'create_new_batch': 1,
            'batch_number_series': 'SEMI_DP_.######',
            "default_material_request_type": "Manufacture",
            "weight_uom": "kg",
            "is_purchase_item": 0,
            "item_defaults": [
                { 
                    "default_warehouse": "锻造车间仓库 - 百兰",
                }
            ]
        })
        new_doc.insert(ignore_permissions=True)
        frappe.db.commit()
        # frappe.msgprint(f"新建{frappe.bold('锻坯')} {item_name}", indicator="green", alert=True)
        return new_doc
    else: 
        return frappe.get_cached_doc("Item", item_name)
        
def create_bom(s_name, t_name):
    find_bom = frappe.get_all('BOM', filters=[['item','=', t_name], ['is_default','=', 1]])
    if len(find_bom) == 0:
        new_doc = frappe.get_doc({
            'doctype': 'BOM',
            'item': t_name,
            "items": [
                { 
                    "item_code": s_name,
                    "qty": 1,
                }
            ]
        })
        # new_doc.insert(ignore_permissions=True)
        new_doc.submit()
        frappe.db.commit()
        # frappe.msgprint(f"新建BOM {t_name}", indicator="green", alert=True)
        return new_doc
    else: 
        return frappe.get_cached_doc("BOM", find_bom[0].name)
        
def create_work_order(bom_name, item_name, piece, wip_warehouse, fg_warehouse):
    wo_doc = make_work_order(bom_name, item_name, piece)
    wo_doc.wip_warehouse = wip_warehouse
    wo_doc.fg_warehouse = fg_warehouse
    wo_doc.submit()
    # frappe.db.commit()
    return wo_doc

def create_bar_sabb(item_code, qty, batch_qtys):
    # print("新建SABB", opts.raw_name, opts.weight, opts.batchs)
    sabb_doc = frappe.get_doc({
        'doctype': 'Serial and Batch Bundle',
        # 'company': '百兰车轴',
        'item_code': item_code,
        'has_batch_no': 1,
        'warehouse': '短棒料仓 - 百兰',
        'type_of_transaction': 'Outward',
        'total_qty': qty, 
        'voucher_type': 'Stock Entry',
    })
    for bw in batch_qtys:
        sabb_doc.append('entries', {
            'batch_no': bw[0],
            'qty': bw[1],
        })
    sabb_doc.insert(ignore_permissions=True)
    # frappe.db.commit()
    return sabb_doc.name

def create_stock_entry(wo_name, sabb):
    purpose = 'Material Transfer for Manufacture'
    se_dict = make_stock_entry(wo_name, purpose)
    se_dict.get('items')[0]['serial_and_batch_bundle'] = sabb
    se_doc = frappe.get_doc(se_dict)
    se_doc.submit()
    # frappe.db.commit()
    return se_doc

def adjust_short_bar_status(batch_qtys, se_doc_name):
    for batch_qty in batch_qtys:
        srb_doc = frappe.get_doc("Short Raw Bar", batch_qty[0])
        voucher_add = {
            'voucher_no': se_doc_name,
            'voucher_type': 'wo_wip',
            'voucher_qty': batch_qty[1]
        }
        vn_obj = safe_json_loads_from_str(srb_doc.voucher_no ) or []
        vn_obj.append(voucher_add)
        print_red(srb_doc.name)
        print_red(vn_obj)
        srb_doc.update({
            "status": "锻造车间wip",
            "warehouse": "锻造车间仓库 - 百兰",
            "wip_piece": srb_doc.wip_piece + batch_qty[1],
            "remaining_piece": srb_doc.remaining_piece - batch_qty[1],
            "voucher_no": frappe.as_json(vn_obj)
        })
        srb_doc.save()

def create_op_flow(batch_qtys, item, se_doc_name, s_item_name):
    for batch_qty in batch_qtys:
        op_batch_no = batch_qty[0]
        op_piece = batch_qty[1]
        frappe.get_doc({
            "doctype": "Raw Op Flow",
            "record_type": "批次",
            "op_type": "短棒料发料wip",
            "batch_doc": "Short Raw Bar",
            "batch_no": op_batch_no,
            "link_doc_type": "Stock Entry",
            "link_doc": se_doc_name,
            "item_name": s_item_name,
            "heat_no": item.heat_no,  # 多条会有有多个热处理号
            "length": item.length, # 只记录第一个批次的长度
            "piece": op_piece,
            "weight": item.qty,
        }).save()


""" 短棒料 根据生产工单 转换成锻坯部分
    主要完成为生产工单的物料转移设定正确的短棒料批次号
"""
# up_obj_mock2 = {'work_order': 'MFG-WO-2024-00033', 'out_piece': '21', 'wo_qty': '21', 'name': 'DBL-20240703-462Z-4E', 'owner': 'gaoxuesong@hbbbl.top', 'creation': '2024-07-03 17:01:15', 'modified': '2024-07-16 11:15:58', 'modified_by': 'Administrator', '_user_tags': '', '_comments': '', '_assign': '', '_liked_by': '', 'docstatus': '0', 'idx': '0', 'raw_bar_name': '4E_短棒料', 'heat_no': '24011462Z', 'in_piece': '21', 'remaining_piece': '0', 'wip_piece': '32', 'accu_piece': '63', 'status': '锻造车间wip', 'semi_product': '4E', '_comment_count': '0', '_idx': '0', 'cmd': 'bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar.work_order_done'}
up_obj_mock2 = {}

# http://dev2.localhost:8000/api/method/bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar.product_out?scan_barcode=123
@frappe.whitelist()
def work_order_done(**kwargs):
    print_red("srb work_order_done No_2")
    # print_blue(kwargs)
    if not kwargs:
        print_red("mock data 😁")
        kwargs = up_obj_mock2 #置入假数据
    kwargs = frappe._dict(kwargs)
    # _print_green_pp(kwargs)

    bar_bacth_no = kwargs.get("name")
    bar_bacth_qty = cint(kwargs.get("out_piece"))
    # forge_batch_no = kwargs.get("forge_batch_no")
    # 1. make sabb
    sabb_name = create_bar_sabb_for_wo_done(kwargs.raw_bar_name, bar_bacth_qty, (bar_bacth_no, bar_bacth_qty))

    # 2. make stock entry
    se_doc = create_stock_entry_for_wo_done(kwargs.work_order, sabb_name, bar_bacth_qty)
    return kwargs.get('work_order')
    # 3.完成后，修改短棒料的状态为‘锻造车间wip’,修改短棒料生产数量（在stock entry 的hook中完成）

def create_bar_sabb_for_wo_done(item_code, qty, batch_qty):
    sabb_doc = frappe.get_doc({
        'doctype': 'Serial and Batch Bundle',
        'item_code': item_code,
        'has_batch_no': 1,
        'warehouse': '锻造车间仓库 - 百兰',
        'type_of_transaction': 'Outward',
        'total_qty': qty, 
        'voucher_type': 'Stock Entry',
        'entries': [
            {
                'batch_no': batch_qty[0],
                'qty': batch_qty[1],
            }
        ]
    })
    sabb_doc.insert(ignore_permissions=True)
    return sabb_doc.name

def create_stock_entry_for_wo_done(wo_name, sabb, qty):
    se_dict = make_stock_entry(wo_name, 'Manufacture', qty)
    se_dict.get('items')[0]['serial_and_batch_bundle'] = sabb
    se_doc = frappe.get_doc(se_dict)
    se_doc.submit()
#     frappe.db.commit()
    return se_doc



# sb.pad_semi_name(filters, "None")

# kwargs = '''
# {'raw_bar_name': '50H-150_短棒料', 'bar_radio': '720', 'bar_piece': '62', 'bar_weight': '6345', 'total': '{"name":"50H-150","bundle_cnt":2,"weight":6345,"piece":6,"length":45360,"ratio":"720","bar_piece":62,"batchs":[{"batch_no":"B22421204/0211","weight":3172},{"batch_no":"B22421204/0212","weight":3173}]}', 'raw_name': '50H-150', 'raw_weight': '6345', 'batchs': '[{"batch_no":"B22421204/0211","weight":3172},{"batch_no":"B22421204/0212","weight":3173}]', 'cmd': 'bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry'}
# '''
# k3 = eval(kwargs) # 不能解析'''的换行缩进
""" test info
import bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar as rsb
rsb.product_out()
rsb.work_order_done()
docs = frappe.get_all("Short Raw Bar")
sb.raw_name(item_name = 'sb-150', item_group = "原材料", uom='kg')
sb.clear_db()
"""
