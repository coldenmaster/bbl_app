# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

# import frappe
import json
from bbl_app.utils.func import raw_leng_to_weight
from bbl_app.utils.uitls import load_pr_items, load_pr_items_0, load_sb_out_items
import frappe
from frappe.model.create_new import get_new_doc
from frappe.model.document import Document
from frappe.utils.data import cint, cstr, flt, nowdate, sbool

from bbl_api.utils import clear_db_for_dev, print_blue, print_green, print_green_pp, print_red, print_yellow, timer


class SteelBatch(Document):
    
    def save(self):
        print_green("sb save")
        if not self.is_new():
            self.clear_remaining()
            # print_red('steel save() is new')
            # print_blue('steel save()')
            # print_blue(self)
            # print_blue(vars(self))
            # self.create_heat_no()
            # self.create_batch_no()
            # self.create_sabb()
            # self.set_remaining()
        # else:
        return super().save()
        
    def insert(self):
        print_green("sb insert")
        if self.is_new() and self.get('create_item'):
            _create_item(self.raw_name)
        if not frappe.db.exists('Item', self.raw_name):
            frappe.throw(f"原材料 {self.raw_name} 未找到")
            
        if self.is_new():
            self.create_heat_no()
            self.set_remaining()
        else:
            self.clear_remaining()
        return super().insert()
    
    
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
            # frappe.msgprint(f"新建炉号 {self.heat_no}", indicator="green", alert=True)
            
            
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
            self.origin_piece = self.remaining_piece
            self.remaining_weight = cint(self.weight)

    def set_expected(self):
        if (not self.material_ratio):
            return
        piece1 = cint(self.steel_piece)
        piece2 = cint(self.piece2)
        piece3 = cint(self.piece3)
        length1 = cint(self.length)
        length2 = cint(self.length2)
        length3 = cint(self.length3)
        piece_add = piece1 + piece2 + piece3
        ratio = cint(self.material_ratio) + 3
        if ((not (piece2 or piece3)) or self.remaining_piece != piece_add):
            # 不能知道具体根数和匹配长度，只有以一号长度估算
            bar_1 = cint(length1 / ratio)
            self.expected_quantity = bar_1 * self.remaining_piece
            self.expected_scrap = (length1 - ratio * bar_1) * self.remaining_piece
        else:
            bar_1 = cint(length1 / ratio)
            self.expected_quantity = bar_1 * piece1
            self.expected_scrap = (length1 - ratio * bar_1) * piece1
            if piece2:
                bar_1 = cint(length2 / ratio)
                self.expected_quantity += bar_1 * piece2
                self.expected_scrap += (length2 - ratio * bar_1) * piece2
            if piece3:
                bar_1 = cint(length3 / ratio)
                self.expected_quantity += bar_1 * piece3
                self.expected_scrap += (length3 - ratio * bar_1) * piece3

            

    # def before_insert(self):
    #     print_green('steel before_insert')

    # def before_validate(self):
    #     print_green('steel before_validate')
    
    # def validate(self):
    #     print_green('steel validate')
    
    def before_save(self):
        print_green('steel before_save')
        self.set_expected()

    def on_trash(self):
        if ("Administrator" != frappe.session.user ):
            frappe.throw("只有管理员才能删除此文档")




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
    sabb_no = 'YGRK-' + batchs[0].name + "/" + cstr(len(batchs))
    # sabb_no = 'YGRK-' + batchs[0].name + "/" + len(batchs)
    if (frappe.db.exists('Serial and Batch Bundle', sabb_no)):
        frappe.delete_doc('Serial and Batch Bundle', sabb_no)
        # print_yellow("删除 SABB：" + sabb_no)
        frappe.db.commit()
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
    frappe.db.commit()
    # frappe.msgprint(f"新建 SABB: {sabb_no}", indicator="green", alert=True)
    # frappe.throw(f"新建 SABB: {sabb_no}")
    return new_sabb_doc.name
    

@frappe.whitelist()
def pr_send_items(**kwargs):
    # print_blue(kwargs)
    if not kwargs:
        print_red("mock data 😁")
        kwargs = load_pr_items_0() #置入假数据
    items = frappe.parse_json(kwargs["items"])
    #     /* 后台处理
    # 同时处理多种产品入库
    # 1.根据产品名称聚合条目
    # 2.根据条目生成batch
    # 3.生成sabb
    # 4.生成purchase_receipt_item
    # */
    print("条目数❤：", len(items))
    # print_green_pp(items[0])
    item_names = [i["raw_name"] for i in items]
    batch_nos = [i["name"] for i in items]
    item_names_set = set(item_names)
    items_info = {i:{"batch_no": [], "batchs": []} for i in item_names_set}
    # 查询出全部产品数据
    sb_docs = frappe.get_all("Steel Batch", filters={"name": ("in", batch_nos)}, fields=["name", "raw_name", "steel_piece", "weight", "remaining_piece", "remaining_weight", "supplier"])
    # print_cyan(sb_docs)
    supplier = [sb["supplier"] for sb in sb_docs]
    if len(set(supplier)) > 1:
        frappe.throw("供应商不一致")
    for sb in sb_docs:
        items_info[sb.raw_name]["batchs"].append(sb)
        items_info[sb.raw_name]["batch_no"].append(sb.name)
        items_info[sb.raw_name]["remaining_piece"] = items_info[sb.raw_name].get("remaining_piece", 0) + sb.remaining_piece
        items_info[sb.raw_name]["remaining_weight"] = items_info[sb.raw_name].get("remaining_weight", 0) + sb.remaining_weight
    # print_green_pp(items_info)
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
        # "name": "PR-" + nowdate(),
        "supplier": sb_docs[0]["supplier"],
        "accepted_warehouse": "原钢堆场 - 百兰",
        "items": items,
    }
    new_pr_doc = frappe.new_doc(**new_pr_kw)
    return new_pr_doc



# sb_out_items = {'semi_product': '06240', 'raw_bar_name': '06240_短棒料', 'bar_ratio': '780', 'bar_piece': '27', 'bar_weight': '9172', 'scrap_length': '1539', 'scrap_weight': '214.9', 'stock_entry': 'MAT-STE-2024-00184', 'bar_batch': 'DBL-20240614-1925-240', 'check_zhxl': '1', 'zh_semi_product': '30BC', 'zh_raw_bar_name': '30BC_短棒料', 'zh_bar_ratio': '805', 'zh_bar_piece': '22', 'zh_bar_weight': '333', 'zh_bar_batch': 'DBL-20240614-1925-240', 'raw_name': '50H-150', 'raw_weight': '9172', 'batchs': '[{"batch_no":"B22421204/0221","weight":9172}]', 'diameter': '150', 'crap_weight': '214.9', 'cmd': 'bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry'}
sb_out_items1 = {'semi_product': '06240',
    'raw_bar_name': '06240_短棒料',
    'bar_ratio': '780',
    'bar_piece': '100',
    'bar_weight': '9172',
    'scrap_length': '1539',
    'scrap_weight': '214.9',
    'stock_entry': 'MAT-STE-2024-00185',
    'bar_batch': 'DBL-20240614-1925-240',
    'check_zhxl': '1',
    'zh_semi_product': '30BC',
    'zh_raw_bar_name': '30BC_短棒料',
    'zh_bar_ratio': '805',
    'zh_bar_piece': '30',
    'zh_bar_weight': '333',
    'zh_bar_batch': 'DBL-20240614-1925-0BC',
    'raw_name': '50H-150',
    'raw_weight': '9172',
    # 'batchs': '[{"batch_no":"B22421204/0221", "weight":9172},{"batch_no":"B22421204/0225", "weight":3172}]',
    'batchs': '[{"batch_no":"B22421204/0221", "weight":9172}]',
    'diameter': '150',
    'crap_weight': '214.9',
    'cmd': 'bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry'
}


sb_out_items = {'semi_product': '06240', 'raw_bar_name': '06240_短棒料', 'bar_ratio': '780', 'bar_piece': '27', 'bar_weight': '3172', 'scrap_length': '1539', 'scrap_weight': '214.9', 'stock_entry': 'MAT-STE-2024-00187', 'bar_batch': 'DBL-20240617-1925-240', 'check_zhxl': '1', 'zh_semi_product': 'EQ145', 'zh_raw_bar_name': 'EQ145_短棒料', 'zh_bar_ratio': '820', 'zh_bar_piece': '10', 'zh_bar_weight': '1151', 'zh_bar_batch': 'DBL-20240617-1925-145', 'raw_name': '50H-150', 'raw_weight': '3172', 'batchs': '[{"batch_no":"B22421204/0225","weight":3172}]', 'diameter': '150', 'crap_weight': '214.9', 'cmd': 'bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry'}
# http://dev2.localhost:8000/api/method/bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry?scan_barcode=123
@frappe.whitelist()
def make_out_entry(**kwargs):
    """ 
    原材料下料生产出库时，建立stock entry草稿:
    1.
    """
    # print_blue_pp(kwargs)
    print_blue(kwargs)
    if not kwargs:
        print_red("mock data 😁")
        kwargs = sb_out_items #置入假数据

    kwargs = frappe._dict(kwargs)
    raw_name = kwargs.raw_name
    raw_weight = cint(kwargs.raw_weight)
    out_weight = cint(kwargs.bar_weight)
    raw_bar_name = kwargs.raw_bar_name
    bar_piece = cint(kwargs.bar_piece)
    bar_ratio = cint(kwargs.bar_ratio)
    diameter = cint(kwargs.diameter)
    stock_entry_name = kwargs.get("stock_entry", None)
    bar_batch = kwargs.get("bar_batch", None)
    scrap_name = '原材料头'
    scrap_weight = cint(kwargs.crap_weight)
    zh_part2_weight = cint(kwargs.zh_bar_weight) 
    zh_bar_piece = cint(kwargs.zh_bar_piece)
    raw_batchs = json.loads(kwargs["batchs"])
    is_zhxl = sbool(kwargs.check_zhxl)
    # print_green(kwargs)
    
    # 新建bar_batch_no:
    create_bar_item(raw_bar_name)
    create_bar_batch(bar_batch, raw_bar_name)

    if raw_weight < out_weight:
        frappe.throw("出库重量不能大于剩余重量")
    if len(raw_batchs) > 1 and (raw_weight > out_weight) :
        frappe.throw("只能进行单捆的部分出库")
        
    # todo 部分下料:
    part_remaining_weight = raw_weight - out_weight
    is_bfxl = bool(part_remaining_weight > 0)
    zh_part1_weight =  out_weight - zh_part2_weight - scrap_weight
    # target_out1_weight = out_weight if not is_zhxl else zh_part1_weight

    # 原材料sabb
    sabb_opts = frappe._dict({
        "raw_name": raw_name,
        "weight": out_weight,
        "batchs": raw_batchs,
    })
    # 短棒料一sabb
    sabb_bar_opts = frappe._dict({
        "name": raw_bar_name,
        "piece": bar_piece,
        "batchs": [(bar_batch, bar_piece),],
    })
        
    sabb_name = create_sabb(sabb_opts)
    sabb_bar_name = create_bar_sabb(sabb_bar_opts)
    
    items = [
                {
                    "item_code": raw_name,
                    "qty": out_weight,
                    "s_warehouse": "原钢堆场 - 百兰",
                    "uom": "KG",
                    "serial_and_batch_bundle": sabb_name,
                },
                {
                    "item_code": raw_bar_name,
                    "qty":  bar_piece,
                    # "s_warehouse": "",
                    "t_warehouse": "短棒料仓 - 百兰",
                    "uom": "根",
                    "is_finished_item": 1,
                    "serial_and_batch_bundle": sabb_bar_name,
                    # "set_basic_rate_manually": 1,
                },
            ]

    
    # todo 综合下料处理部分
    if kwargs.check_zhxl == '1':
    # 短棒料2/综合下料sabb
        create_bar_item(kwargs.zh_raw_bar_name)
        create_bar_batch(kwargs.zh_bar_batch, kwargs.zh_raw_bar_name)
        sabb_bar_opts_zh = frappe._dict({
            "name": kwargs.zh_raw_bar_name,
            "piece": zh_bar_piece,
            "batchs": [(kwargs.zh_bar_batch, zh_bar_piece),],        
        })
        sabb_bar_name_zh = create_bar_sabb(sabb_bar_opts_zh)
        item = {
                "item_code": kwargs.zh_raw_bar_name,
                "qty":  zh_bar_piece,
                "t_warehouse": "短棒料仓 - 百兰",
                "uom": "根",
                "is_finished_item": 1,
                "serial_and_batch_bundle": sabb_bar_name_zh,
                # "set_basic_rate_manually": 1,
            }
        items = [*items, item]
    # 综合下料时计算：

    is_cbl = sbool(kwargs.check_cbl)
    if is_cbl:
        cbl_bar_name = kwargs.cbl_bar_name
        create_bar_item(cbl_bar_name, '长料头')
        li = bar_batch.split('-')[1:-1]
        cbl_bar_batch = '-'.join(["CLT", *li, kwargs.cbl_bar_length])
        cbl_bar_piece = cint(kwargs.cbl_bar_piece)
        create_bar_batch(cbl_bar_batch, cbl_bar_name)
        sabb_bar_opts_cbl = frappe._dict({
            "name": cbl_bar_name,
            "piece": cbl_bar_piece,
            "batchs": [(cbl_bar_batch, cbl_bar_piece),],        
        })
        sabb_bar_name_cbl = create_bar_sabb(sabb_bar_opts_cbl)
        item = {
                "item_code": cbl_bar_name,
                "qty":  cbl_bar_piece,
                "t_warehouse": "短棒料仓 - 百兰",
                "uom": "根",
                "is_finished_item": 0,
                "serial_and_batch_bundle": sabb_bar_name_cbl,
                "allow_zero_valuation_rate": 1,
            }
        items = [*items, item]

    if scrap_weight:
        item = {
                    "item_code": scrap_name,
                    "qty": scrap_weight,
                    "t_warehouse": "废料堆场 - 百兰",
                    "uom": "KG",
                    "is_scrap_item": 1,
                    "allow_zero_valuation_rate": 1,
                }
        items = [*items, item]
        # items = items[:-1]
     
     
    # print_green_pp(items)
    # todo 建单据草稿 
    if stock_entry_name:
        # 存在物料转移单据，进行查询修改
        manufacture_out_doc = frappe.get_doc("Stock Entry", stock_entry_name)
        for item in items:
            manufacture_out_doc.append("items", item)
        # print_green_pp(manufacture_out_doc)
        
    else:
        # 新建stock_entry
        # items[1]["is_finished_item"] = 1
        new_kw = {
            "doctype": "Stock Entry",
            "stock_entry_type": "原材料下料出库",
            "from_warehouse": "原钢堆场 - 百兰",
            "to_warehouse": "短棒料仓 - 百兰",
            "items": items,
        }
        manufacture_out_doc = frappe.get_doc(new_kw)
    
    # 遍历items，对短棒料进行价格设置
    manufacture_out_doc.save()
    childern_docs = manufacture_out_doc.items
    # print_green_pp(childern_docs[0].as_dict())
    
    # 重新设计，计算最后一套出入库：
    for i in range(len(childern_docs) - 1, -1, -1):
        item = childern_docs[i]
        if item.item_group == "原材料":
            raw_item = item
            # print_green(f'{raw_item.as_dict() = }')
            bar1_item = childern_docs[i+1]
            if not is_zhxl:
                sum = raw_item.qty * raw_item.basic_rate
                # if is_bfxl:
                #     sum = sum * raw_item.qty / raw_weight   
                bar1_item.basic_rate = sum / bar1_item.qty
                print_red(f'计算短棒料价格1:  {raw_item.basic_rate} x {raw_item.qty } / {bar1_item.qty} = {bar1_item.basic_rate}')
            else:    
                bar2_item = childern_docs[i+2]
                sum = raw_item.qty * raw_item.basic_rate
                total_weight = zh_part1_weight + zh_part2_weight
                part1_price = sum * zh_part1_weight / total_weight
                bar1_item.basic_rate = part1_price / bar1_item.qty
                bar2_item.basic_rate = (sum - part1_price) / bar2_item.qty
                print_red(f'计算短棒料价格2 综合:  {raw_item.basic_rate} x {raw_item.qty }  = {sum}')
            break # 只进行最后一个原材料组的计算
                            
    
    # 原材料标注为‘草稿’
    for batch_no in raw_batchs:
        frappe.db.set_value("Steel Batch", batch_no, "status", "草稿")

    manufacture_out_doc.save()
    
    # 数据存入Temp Doc Value,供以后submit时使用
    temp_doc = frappe.get_doc({
        'doctype': 'Temp Doc Value',
        'doc_type': 'Stock Entry',
        'doc_name': manufacture_out_doc.name,
        'doc_status': manufacture_out_doc.docstatus,
        'data_1': bar_ratio, # 记录实际下料长度
        'data_2': flt(raw_leng_to_weight(diameter, bar_ratio), 2), # 记录实际下料重量
        'data_3': cint(kwargs.get('out_piece')), # 记录实际下料长度
    })
    temp_doc.data_json = json.dumps(kwargs)
    temp_doc.insert(ignore_permissions=True)
    
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
        if weight > opts.weight:
            weight = opts.weight
        sabb_doc.append('entries', {
            'batch_no': batch_no,
            'qty': weight,
        })
        # if weight > opts.weight:
        #     break
    sabb_doc.insert(ignore_permissions=True)
    frappe.db.commit()
    # frappe.msgprint(f"新建 SABB: {sabb_doc.name}", indicator="green", alert=True)
    return sabb_doc.name

def create_bar_sabb(opts):
    # print("新建SABB", opts.raw_name, opts.weight, opts.batchs)
    sabb_doc = frappe.get_doc({
        'doctype': 'Serial and Batch Bundle',
        'company': '百兰车轴',
        'item_code': opts.name,
        'has_batch_no': 1,
        'warehouse': '短棒料仓 - 百兰',
        'type_of_transaction': 'Inward',
        'total_qty': opts.piece, 
        'voucher_type': 'Stock Entry',
    })
    for bw in opts.batchs:
        # print_red(bw)
        sabb_doc.append('entries', {
            'batch_no': bw[0],
            'qty': bw[1],
        })
    sabb_doc.insert(ignore_permissions=True)
    frappe.db.commit()
    # frappe.msgprint(f"新建短棒料SABB: {sabb_doc.name}", indicator="green", alert=True)
    return sabb_doc.name

def create_bar_batch(batch_no, item_code):
    if (frappe.db.exists('Batch', batch_no)):
        return
    batch_doc = frappe.get_doc({
        'doctype': "Batch",
        'batch_id': batch_no,
        'item': item_code,
        'supplier': '',
    })
    batch_doc.insert(ignore_permissions=True)
    # print_red(batch_doc.__dict__)
    frappe.db.commit()
    # frappe.msgprint(f"新建 物料批号: {batch_doc.name} 成功", indicator="green", alert=True)

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
            "item_defaults": [
                { "default_price_list": "原材料价格表", }
            ]
        })
        new_doc.insert(ignore_permissions=True)
        frappe.db.commit()
        frappe.msgprint(f"新建原材料 {item_name}", indicator="green", alert=True)
        return new_doc
    else: 
        return False

def create_bar_item(item_name, item_type = '短棒料'):
    if (not frappe.db.exists('Item', item_name)):
        # print("此原材料不存在，新建")
        new_doc = frappe.get_doc({
            'doctype': 'Item',
            'item_code': item_name,
            "item_group": item_type,
            "stock_uom": "根",
            'has_batch_no': 1,
            # 'create_new_batch': 1,
            # 'batch_number_series': batch_patern,
            "default_material_request_type": "Manufacture",
            "weight_uom": "kg",
            "is_purchase_item": 0,
            "item_defaults": [
                { 
                    "default_warehouse": "短棒料仓 - 百兰",
                    "default_price_list": "短棒料价格表", 
                }
            ]
        })
        new_doc.insert(ignore_permissions=True)
        frappe.db.commit()
        frappe.msgprint(f"新建短棒料 {item_name}", indicator="green", alert=True)
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


@frappe.whitelist()
def set_semi_product(**kwargs):
    opts = frappe._dict(kwargs)
    filters = [["heat_no", "=", opts.heat_no], ]
    if (opts.length):
        filters.append(["length", "=", opts.length])
    doc_t = frappe.get_all("Steel Batch", filters=filters)
    for t in doc_t:
        doc = frappe.get_doc("Steel Batch", t.get("name"))
        doc.semi_product = opts.semi_product
        doc.save()
    frappe.db.commit()
    return f"处理数量：{len(doc_t)}条"
    

# todo 清除数据库中数据，进行干净清楚的测试
@timer
def clear_db():
    print('clear_db')
    clear_db_for_dev()



"""  可用 系统控制台 执行代码 (用来根据炉号和长度，更改sb_doc上的半成品名称及倍尺)
filters = [
    ["heat_no", "=", "V12400736"],
    # ["raw_name", "=", "40CrH-145"],
    # ["length", "=", "7620"],
]
doc_t = frappe.get_all("Steel Batch", filters=filters, fields=["name", "heat_no"])
for t in doc_t:
    doc = frappe.get_doc("Steel Batch", t.get("name"))
    doc.semi_product = '4E'
    doc.save()
frappe.db.commit()
print(f"处理数量： {len(doc_t)}")

# 手动计算出预期数量
def flush_expected():
    docs = frappe.get_all("Steel Batch")
    # print(f"查询数量是：{len(docs)}")
    # print(type(docs[0]))
    # print(docs[0])
    for d in docs:
        doc = frappe.get_doc("Steel Batch", d.get("name"))
        doc.save()
    frappe.db.commit()
 """



# sb.pad_semi_name(filters, "None")

# kwargs = '''
# {'raw_bar_name': '50H-150_短棒料', 'bar_radio': '720', 'bar_piece': '62', 'bar_weight': '6345', 'total': '{"name":"50H-150","bundle_cnt":2,"weight":6345,"piece":6,"length":45360,"ratio":"720","bar_piece":62,"batchs":[{"batch_no":"B22421204/0211","weight":3172},{"batch_no":"B22421204/0212","weight":3173}]}', 'raw_name': '50H-150', 'raw_weight': '6345', 'batchs': '[{"batch_no":"B22421204/0211","weight":3172},{"batch_no":"B22421204/0212","weight":3173}]', 'cmd': 'bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry'}
# '''
# k3 = eval(kwargs) # 不能解析'''的换行缩进
""" test info
import bbl_app.raw_material_manage.doctype.steel_batch.steel_batch as sb
sb.pr_send_items()
sb.make_out_entry(**sb.k3)
docs = frappe.get_all("Steel Batch")
sb.raw_name(item_name = 'sb-150', item_group = "原材料", uom='kg')
sb.clear_db()
"""

