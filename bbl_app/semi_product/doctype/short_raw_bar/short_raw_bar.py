# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

# import frappe
import json
from bbl_app.raw_material_manage.doctype.steel_batch.steel_batch import create_bar_item
from bbl_app.utils.bbl_utils import make_semi_batch_no_name, make_semi_stage_name, semi_name_slug
from bbl_app.utils.utils import safe_json_loads_from_str
from erpnext.manufacturing.doctype.work_order.work_order import close_work_order, make_stock_return_entry, make_work_order, make_stock_entry
import frappe
from frappe.model.document import Document
from frappe.utils.data import cint

from bbl_api.utils import _print_blue_pp, _print_green_pp, print_blue, print_blue_pp, print_green, print_green_pp, print_red, print_yellow

class ShortRawBar(Document):
    pass

    def on_trash(self):
        # print_red("srb on_trash")
        # print_red(frappe.session.user)
        if ("Administrator" != frappe.session.user ):
            frappe.throw("只有管理员才能删除此文档")





up_obj_mock = {}

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

    # 3.全部单据创建-提交完成，修改短棒料的状态为‘锻造wip’
    adjust_short_bar_status(batch_qtys, wo_doc.name)
        # frappe.set_value("Short Raw Bar", batch_qty[0], "remaining_piece", 0)
    
    # 4.记录操作流水(此处记录多少短棒料转移到锻造wip)
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
    # print("新建SABB", item_code, qty, batch_qtys)
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
    se_doc.stock_entry_type = 'Material Transfer for Manufacture'
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
        # print_red(srb_doc.name)
        # print_red(vn_obj)
        srb_doc.update({
            "status": "锻造wip",
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
    # 3.完成后，修改短棒料的状态为‘锻造wip’,修改短棒料生产数量（在stock entry 的hook中完成）

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


up_obj_mock2 = {
    'old_sbr_doc_id': 'DBL-0905-4E-24011462Z', 
    'new_product_name': 'D-30N-B', 
    'qty': '5', 
    'cmd': 'bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar.change_srb_name'
    }

@frappe.whitelist()
def change_srb_name(**kwargs):
    print_red("srb change_srb_name")
    from bbl_app.utils.utils import bbl_dict

    # print_blue(kwargs)
    if not kwargs:
        print_red("mock data 😁")
        kwargs = up_obj_mock2 #置入假数据
    kwargs = frappe._dict(kwargs)
    # 获取doc
    from_srb_doc_id = kwargs.old_sbr_doc_id
    srb_doc = frappe.get_doc("Short Raw Bar", from_srb_doc_id)
    # print_red(kwargs)
    # print_red(srb_doc)
    target_product_name = kwargs.new_product_name
    target_product_name_slug = semi_name_slug(kwargs.new_product_name)
    # target_item_name = target_product_name.replace(" ", "").replace("-", "")  + "_短棒料"
    target_item_name = make_semi_stage_name(target_product_name, 16, "短棒料")

    target_qty = cint(kwargs.qty)
    # print(srb_doc.as_dict())
    # 根据源doc内短棒料批次，新建目标短棒料批次
    # md = frappe.utils.today().replace("-", "")[-4:]
    # to_batch_no = "DBL-" + md + "-" + target_product_name[-6:] + "-" + srb_doc.heat_no[-10:]
    # to_batch_no = make_semi_batch_no_name(target_product_name, "DBL", srb_doc.heat_no)
    # 短棒料到底需要根据日期 分批吗？
    to_batch_no = "DBL-" + target_product_name_slug + "-" + srb_doc.heat_no
    # print_red(to_batch_no)

    # create_item(target_item_name)
    create_bar_item(target_item_name)
    if (not frappe.db.exists('Batch', to_batch_no)):
        batch_no_doc = frappe.get_doc({
            'doctype': 'Batch',
            'batch_id': to_batch_no,
            'item': target_item_name,
        })
        batch_no_doc.insert(ignore_permissions=True)

    old_sabb_kw ={
        "doctype": "Serial and Batch Bundle",
        'item_code': srb_doc.raw_bar_name,
        'has_batch_no': 1,
        'warehouse': '短棒料仓 - 百兰',
        'type_of_transaction': 'Outward',
        'total_qty': target_qty, 
        'voucher_type': 'Stock Entry',
        'entries': [{'batch_no': srb_doc.name,
                'qty': target_qty}],
    }
    new_sabb_kw ={
        "doctype": "Serial and Batch Bundle",
        # 'company': '百兰车轴',
        # 'naming_series': sabb_no,
        # 'name': sabb_no,
        'item_code': target_item_name,
        'has_batch_no': 1,
        'warehouse': '短棒料仓 - 百兰',
        'type_of_transaction': 'Inward',
        'total_qty': target_qty, 
        'voucher_type': 'Purchase Receipt',
        'entries': [{'batch_no': to_batch_no,
                'qty': target_qty}],
    }
    old_sabb_doc = frappe.get_doc(old_sabb_kw)
    new_sabb_doc = frappe.get_doc(new_sabb_kw)
    old_sabb_doc.insert(ignore_permissions=True)
    new_sabb_doc.insert(ignore_permissions=True)

    # 新建物料转移单，直接进行提交
    # se_dict = make_stock_entry(srb_doc.name, 'Material Transfer', kwargs.qty)
    se_doc = frappe.get_doc({
        'doctype': 'Stock Entry',
        'stock_entry_type': 'Repack',
        'items':[
                    {
                        "item_code": srb_doc.raw_bar_name,
                        "qty": target_qty,
                        "s_warehouse": "短棒料仓 - 百兰",
                        "uom": "根",
                        "serial_and_batch_bundle": old_sabb_doc.name
                    },
                    {
                        "item_code": target_item_name,
                        "qty": target_qty,
                        "t_warehouse": "短棒料仓 - 百兰",
                        "uom": "根",
                        "serial_and_batch_bundle": new_sabb_doc.name
                    }
                ]
    })
    # _print_blue_pp(se_doc.as_dict())
    bbl = bbl_dict
    bbl['srb_change_name_flag'] = 1
    bbl['srb_tmp1'] = {
        'from_srb_doc_id': from_srb_doc_id,
        'target_product_name': target_product_name,
        'target_item_name': target_item_name,
        'to_batch_no': to_batch_no,
        'target_qty': target_qty,
        }
    # print_red(bbl)
    # se_doc.insert(ignore_permissions=True)
    # frappe.db.commit()
    se_doc.submit()
    return se_doc.name


# up_obj_mock2 = {
#     'srb_name': 'DBL-0904-2310D-24011462Z', 
#     'qty': '3', 
#     }

@frappe.whitelist()
def cancel_wo_retrieve_wip(**kwargs):
    print_red("srb cancel_wo_retrieve_wip")
    if not kwargs:
        print_red("mock data 😁")
        kwargs = up_obj_mock2 #置入假数据
    # print_blue(kwargs)
    kwargs = frappe._dict(kwargs)
    up_qty = cint(kwargs.qty)
    # 获取doc
    srb_doc = frappe.get_doc("Short Raw Bar", kwargs.srb_name)
    # 获取srb中的 work_order 记录
    wo_list = frappe.parse_json(srb_doc.voucher_no)
    # _print_blue_pp(wo_list)
    wo_no = wo_list[-1].get('voucher_no')
    wo_qty = wo_list[-1].get('voucher_qty')
    # print(wo_no, wo_qty, kwargs.qty)
    if wo_qty != up_qty:
        frappe.throw("后台获取数量不一致")

    wo_doc = frappe.get_doc("Work Order", wo_no)
    close_work_order(wo_doc.name, 'Closed')

    stock_entry = make_stock_return_entry(wo_doc.name)
    stock_entry.stock_entry_type = 'Wip Retrieve'
    stock_entry.submit()
    # frappe.db.set_value("Work Order", wo_doc.name, "status", "Closed")
    wo_doc.update_status("Closed")
    # _print_blue_pp(stock_entry.as_dict())
    return stock_entry.name




# sb.pad_semi_name(filters, "None")

# kwargs = '''
# {'raw_bar_name': '50H-150_短棒料', 'bar_radio': '720', 'bar_piece': '62', 'bar_weight': '6345', 'total': '{"name":"50H-150","bundle_cnt":2,"weight":6345,"piece":6,"length":45360,"ratio":"720","bar_piece":62,"batchs":[{"batch_no":"B22421204/0211","weight":3172},{"batch_no":"B22421204/0212","weight":3173}]}', 'raw_name': '50H-150', 'raw_weight': '6345', 'batchs': '[{"batch_no":"B22421204/0211","weight":3172},{"batch_no":"B22421204/0212","weight":3173}]', 'cmd': 'bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry'}
# '''
# k3 = eval(kwargs) # 不能解析'''的换行缩进
""" test info
import bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar as rsb
rsb.product_out()
rsb.work_order_done()
rsb.change_srb_name()
rsb.cancel_wo_retrieve_wip()
docs = frappe.get_all("Short Raw Bar")
sb.raw_name(item_name = 'sb-150', item_group = "原材料", uom='kg')
sb.clear_db()
"""
