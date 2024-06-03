# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

# import frappe
import json
from bbl_app.utils.uitls import load_pr_items, load_pr_items_0, safe_dict_json_load
from erpnext.setup.demo import clear_demo_data
import frappe
from frappe.model.document import Document
from frappe.utils import safe_json_loads
from frappe.utils.data import cint, cstr

from bbl_api.utils import clear_db_for_dev, print_blue, print_blue_pp, print_cyan, print_green, print_green_pp, print_red, timer


class SteelBatch(Document):
    
    def save(self):
        if self.is_new():
            # print_red('steel save() is new')
            # print_blue('steel save()')
            # print_blue(self)
            # print_blue(vars(self))
            self.create_heat_no()
            # self.create_batch_no()
            # self.create_sabb()
            self.set_remaining()
        else:
            self.clear_remaining()
        super().save()
        
    
    
    def create_heat_no(self):
        # print_green('steel create_heat_no')
        # 1.检查是否有此炉号，没有则新建
        if (not frappe.db.exists('Heat No', self.heat_no)):
            # print("炉号不存在，新建")
            heat_no_doc = frappe.get_doc({
                'doctype': 'Heat No',
                'heat_no': self.heat_no,
                'product_company': self.product_company,
                'raw_name': self.raw_name,
                'steel_grade': self.steel_grade,
                'diameter': self.diameter,
                'contract_no': self.contract_no,
                'standard': self.standard,
            })
            heat_no_doc.insert(ignore_permissions=True)
            frappe.db.commit()
            frappe.msgprint(f"新建炉号 {self.heat_no}", indicator="green", alert=True)
            
            
    # 2.新建完成后，再建立一个新产品的批次号


    def clear_remaining(self):
        if self.is_new():
            return
        # old_doc = self.get_latest()
        if (self.status == '出完'):
            self.remaining_piece =  0
            self.remaining_weight = 0
            
    def set_remaining(self, hard = False):
        if self.is_new() or hard:
            self.remaining_piece =  cint(self.steel_piece) + cint(self.piece2) + cint(self.piece3)
            self.remaining_weight = cint(self.weight)

            
            
        
    # def before_insert(self):
    #     print_green('steel before_insert')

    # def before_validate(self):
    #     print_green('steel before_validate')
    
    # def validate(self):
    #     print_green('steel validate')
    
    # def before_save(self):
    #     print_green('steel before_save')

def create_batch_no(batch_no, item_name):
    if (not frappe.db.exists('Batch', batch_no)):
        # self.create_item()
        # print("批次号不存在，新建")
        batch_no_doc = frappe.get_doc({
            'doctype': 'Batch',
            'batch_id': batch_no,
            'item': item_name,
        })
        batch_no_doc.insert(ignore_permissions=True)
        # frappe.db.commit()
        # frappe.msgprint(f"新建物料批号 {batch_no}", indicator="green", alert=True)

"""
    这个自动创建功能现在是测试，
    关系太多，可能应该使用时手动建立
"""  
# 建号批次号后建SABB bundle
def create_sabb_pr(batchs):
    # print_green('steel create_sabb')
    sabb_no = 'YGRK-' + batchs[0].name + "/" + cstr(len(batchs))
    # sabb_no = 'YGRK-' + batchs[0].name + "/" + len(batchs)
    # if (not frappe.db.exists('Serial and Batch Bundle', sabb_no)):
    print("新建SABB")
    steel_batch = batchs[0]
    total_weight = sum([x.weight for x in batchs])
    entries = [{'batch_no': x.name,
                'qty': x.weight} for x in batchs]
    new_sabb_kw ={
        "doctype": "Serial and Batch Bundle",
        'company': '百兰车轴',
        'naming_series': sabb_no,
        # 'name': sabb_no,
        'item_code': steel_batch.raw_name,
        'has_batch_no': 1,
        'warehouse': '原钢堆场 - 百兰',
        'type_of_transaction': 'Inward',
        # weight2, weight3 需要时员工手动新建
        'total_qty': total_weight, 
        'voucher_type': 'Purchase Receipt',
        'entries': entries,
    }
    new_sabb_doc = frappe.get_doc(new_sabb_kw)
    new_sabb_doc.insert(set_name=sabb_no, ignore_permissions=True)
    # frappe.db.commit()
    # frappe.msgprint(f"新建 SABB: {sabb_no}", indicator="green", alert=True)
    # frappe.throw(f"新建 SABB: {sabb_no}")
    return new_sabb_doc.name
    

# http://dev2.localhost:8000/api/method/bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry?scan_barcode=123
@frappe.whitelist()
def pr_send_items(**kwargs):
    print_blue(kwargs)
    # kwargs = load_pr_items_0() 置入假数据
    items = frappe.parse_json(kwargs["items"])
    #     /* 后台处理
    # 同时处理多种产品入库
    # 1.根据产品名称聚合条目
    # 2.根据条目生成batch
    # 3.生成sabb
    # 4.生成purchase_receipt_item
    # */
    # print_green_pp(items)
    print("条目数❤：", len(items))
    print_green_pp(items[0])
    item_names = [i["raw_name"] for i in items]
    batch_nos = [i["name"] for i in items]
    item_names_set = set(item_names)
    items_info = {i:{"batch_no": [], "batchs": []} for i in item_names_set}
    print_green_pp(items_info)
    # 查询出全部产品数据
    sb_docs = frappe.get_all("Steel Batch", filters={"name": ("in", batch_nos)}, fields=["name", "raw_name", "steel_piece", "weight", "remaining_piece", "remaining_weight"])
    print_cyan(sb_docs)
    for sb in sb_docs:
        items_info[sb.raw_name]["batchs"].append(sb)
        items_info[sb.raw_name]["batch_no"].append(sb.name)
        items_info[sb.raw_name]["remaining_piece"] = items_info[sb.raw_name].get("remaining_piece", 0) + sb.remaining_piece
        items_info[sb.raw_name]["remaining_weight"] = items_info[sb.raw_name].get("remaining_weight", 0) + sb.remaining_weight
    
    print_green_pp(items_info)
        
    items = []
    for item_name, info in items_info.items():
        # 创建批次号
        for batch_on in info["batch_no"]:
            create_batch_no(batch_on, item_name)
        # 创建SABB
        sabb_name = create_sabb_pr(info["batchs"])
        items.append({
            "item_code": item_name,
            "qty": info["remaining_weight"],
            "t_warehouse": "原钢堆场 - 百兰",
            "uom": "KG",
            "serial_and_batch_bundle": sabb_name,
        })

                
    new_pr_kw = {
        "doctype": "Purchase Receipt",
        "supplier": frappe.defaults.get_user_default("supplier"),
        "accepted_warehouse": "原钢堆场 - 百兰",
        "items": items,
    }
    
    new_pr_doc = frappe.get_doc(new_pr_kw)
    new_pr_doc.insert(ignore_permissions=True)
    frappe.db.commit()
    
    print_blue_pp(new_pr_doc)

    return new_pr_doc.name
    

# http://dev2.localhost:8000/api/method/bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry?scan_barcode=123
@frappe.whitelist()
def make_out_entry(**kwargs):
    # print_blue_pp(kwargs)
    # print(kwargs)

    raw_name = kwargs["raw_name"]
    raw_weight = cint(kwargs["raw_weight"])
    out_weight = cint(kwargs["bar_weight"])
    raw_bar_name = kwargs["raw_bar_name"]
    bar_piece = kwargs["bar_piece"]
    if raw_weight < out_weight:
        frappe.throw("出库重量不能大于剩余重量")

    sabb_opts = frappe._dict({
        "raw_name": raw_name,
        "weight": out_weight,
        "batchs": json.loads(kwargs["batchs"]),
    })
    
    sabb_name = create_sabb(sabb_opts)
    _create_item(raw_bar_name, '短棒料')
    
    new_kw = {
        "doctype": "Stock Entry",
        "stock_entry_type": "Manufacture",
        "from_warehouse": "原钢堆场 - 百兰",
        "to_warehouse": "短棒料仓 - 百兰",
        "items": [
            {
                "item_code": raw_name,
                "qty": out_weight,
                "s_warehouse": "原钢堆场 - 百兰",
                # "t_warehouse": "",
                # "conversion_factor": 1,
                "uom": "KG",
                "serial_and_batch_bundle": sabb_name,
            },
            {
                "item_code": raw_bar_name,
                "qty":  bar_piece,
                # "s_warehouse": "",
                "t_warehouse": "短棒料仓 - 百兰",
                # "conversion_factor": 1,
                "is_finished_item": 1,
                "uom": "根",
            }
        ]
    }
    manufacture_out_doc = frappe.get_doc(new_kw)
    manufacture_out_doc.insert()
    frappe.db.commit()
    # print_red(manufacture_out_doc)
    return manufacture_out_doc.name
    
    # todo 
    # 1.新建SABB for 物料转移（这个过程可能很困难，后台的数据变化，手动如何能完全进行）
    # （进行一步步的手动模拟，操作物料转移）
    # 2.建立物料转移
    # 3.是否根据剩余数量，新建材料入库。（或者，修改长度和，根数。使用同一个批次号）
    # 4.设值批次状态，和新数值。


def create_sabb(opts):
    # print("新建SABB", opts.raw_name, opts.weight, opts.batchs)
    sabb_doc = frappe.get_doc({
        'doctype': 'Serial and Batch Bundle',
        'company': '百兰车轴',
        'item_code': opts.raw_name,
        'has_batch_no': 1,
        'warehouse': '原钢堆场 - 百兰',
        'type_of_transaction': 'Outward',
        'total_qty': opts.weight, 
        'voucher_type': 'Stock Entry',
    })
    for bw in opts.batchs:
        batch_no = bw["batch_no"]
        weight = bw["weight"]
        sabb_doc.append('entries', {
            'batch_no': batch_no,
            'qty': weight,
        })
    sabb_doc.insert(ignore_permissions=True)
    frappe.db.commit()
    frappe.msgprint(f"新建 SABB: {sabb_doc.name}", indicator="green", alert=True)
    return sabb_doc.name

def _create_item(item_name, item_type = '原材料', uom = 'kg', has_batch_no = 1, batch_patern = None):
    if (not frappe.db.exists('Item', item_name)):
        # print("此原材料不存在，新建")
        new_doc = frappe.get_doc({
            'doctype': 'Item',
            'item_code': item_name,
            'item_group': item_type,
            'stock_uom': uom,
            'has_batch_no': has_batch_no,
            'create_new_batch': 1,
            'batch_number_series': batch_patern,
        })
        new_doc.insert(ignore_permissions=True)
        frappe.db.commit()
        frappe.msgprint(f"新建原材料 {item_name}", indicator="green", alert=True)
        return new_doc
    else: 
        return False
        
# /api/method/bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.create_item
@frappe.whitelist()
def raw_name(**args):
    args = frappe._dict(args)
    print_blue(args)
    item_name = args.item_name or ""
    if not item_name_ok(item_name):
        frappe.msgprint("原材料名称,格式不正确,需要" + frappe.bold("xx-##"))
        return True
    doc = _create_item(item_name, args.item_group, args.uom, batch_patern = args.batch_patern)
    return doc and doc.item_name

def item_name_ok(item_name) :
    if '-' in item_name:
        if  cint(item_name.split("-")[1]) > 0:
            return True
    return False

# http://dev2.localhost:8000/api/method/bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.init_all_remaining
# /api/method/bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.init_all_remaining
@frappe.whitelist()
def init_all_remaining():
    # docs = frappe.get_all("Steel Batch", fields=["name", "status"], filters=[["status", "!=", "出完"],])
    docs = frappe.get_all("Steel Batch", fields=["name", "status"])
    # print("init_all_remaining", len(docs))
    for doc in docs:
        # print_blue(doc)
        init_remaining(doc.name, doc.status)
    frappe.db.commit()
    # print_red("process over")
    return "process ok"

def init_remaining(name, status):
    doc = frappe.get_doc("Steel Batch", name)
    if status != '出完':
        doc.set_remaining(hard=True)
    else:
        doc.clear_remaining()
    doc.save()
    

# todo 清除数据库中数据，进行干净清楚的测试
@timer
def clear_db():
    print('clear_db')
    clear_db_for_dev()

# kwargs = '''
# {'raw_bar_name': '50H-150_短棒料', 'bar_radio': '720', 'bar_piece': '62', 'bar_weight': '6345', 'total': '{"name":"50H-150","bundle_cnt":2,"weight":6345,"piece":6,"length":45360,"ratio":"720","bar_piece":62,"batchs":[{"batch_no":"B22421204/0211","weight":3172},{"batch_no":"B22421204/0212","weight":3173}]}', 'raw_name': '50H-150', 'raw_weight': '6345', 'batchs': '[{"batch_no":"B22421204/0211","weight":3172},{"batch_no":"B22421204/0212","weight":3173}]', 'cmd': 'bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry'}
# '''
# k3 = eval(kwargs) # 不能解析'''的换行缩进
""" test info
import bbl_app.raw_material_manage.doctype.steel_batch.steel_batch as sb
sb.make_out_entry(**sb.k3)
docs = frappe.get_all("Steel Batch")
sb.raw_name(item_name = 'sb-150', item_group = "原材料", uom='kg')
sb.clear_db()
"""