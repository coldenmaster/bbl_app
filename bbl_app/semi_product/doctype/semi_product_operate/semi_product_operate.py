# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

from bbl_app.utils.frappe_func import make_simi_product_batch_no
import frappe
from frappe.model.document import Document
from frappe.model.naming import getseries, parse_naming_series
from frappe.utils import get_fullname
from frappe.utils.data import dict_with_keys, today

from bbl_api.utils import _print_blue_pp, print_blue, print_blue_pp, print_green, print_green_pp, print_red


class SemiProductOperate(Document):
    def save(self):
        print_green("半成品加工单 save")
        return super().save()
    
    def submit(self):
        print_green("半成品加工单 submit")
        print_blue_pp(self.as_dict())
        self.employee_submit = get_fullname()
        self.voucher_from = self.spm_source
        self.voucher_to = spm_op(self.as_dict())
        return super().submit()

mock_data = {'amended_from': None,
 'creation': '2024-07-19 17:05:51',
 'docstatus': 1,
 'doctype': 'Semi Product Operate',
 'employee': '我是谁',
 'employee_submit': '小刘',
 'finish_name': '4E_探伤',
 'finish_qty': 24,
 'for_date': '2024-07-19',
 'idx': 0,
 'modified': '2024-07-19 17:05:51',
 'modified_by': 'Administrator',
 'name': 'SPO-YYMMDD-0008',
 'op_flow': None,
 'owner': 'Administrator',
 'parent_from': None,
 'product_name': '4E_锻坯',
 'property_name': None,
 'property_value': None,
 'semi_op_source': '锻坯',
 'semi_op_target': '打磨',
 'semi_product': '4E',
 'source_qty': 24,
 'spm_source': 'DP-4E-V22401504',
 'test': None}

def spm_op(opts):
    print_red("spm_op:半成品加工单 处理半成品管理记录 ")
    if not opts:
        print_red("mock data 😁")
        opts = mock_data #置入假数据
    opts = frappe._dict(opts)
    # print_green(opts)
    # 检查目标产品是否有物料名称，没有新建
    _create_item(opts.finish_name)

    # 创建目标产品的 半成品管理记录
    # 减掉 来源产品的 半成品管理记录
    return _semi_product_batch_convert(opts)

    # 是否还需要 生成半成品加的流水账记录（因为本单据就是操作日记性质）
    # frappe.db.commit() # save() 和 submit(提交) 都会自动提交


def _create_item(item_name, item_type = '过程半成品', warehouse = '锻造车间仓库 - 百兰'):
    if (not frappe.db.exists('Item', item_name)):
        target_job = item_name.split('_')[-1]
        product_form_doc = frappe.get_cached_doc('Product Form', target_job)
        # abbr = frappe.db.get_value('Product Form', target_job, 'abbr')
        # warehouse = frappe.db.get_value('Product Form', target_job, 'default_warehouse')
        abbr = product_form_doc.abbr
        warehouse = product_form_doc.default_warehouse
        print_red(f'新建 半成品 物料 {abbr=}')
        new_doc = frappe.get_doc({
            'doctype': 'Item',
            'item_code': item_name,
            "item_group": item_type,
            "stock_uom": "根",
            'has_batch_no': 1,
            'create_new_batch': 1,
            'batch_number_series': abbr + '.#########',
            "default_material_request_type": "Manufacture",
            "weight_uom": "kg",
            "is_purchase_item": 0,
            "item_defaults": [
                { 
                    "default_warehouse": warehouse,
                }
            ]
        })
        new_doc.insert(ignore_permissions=True)
        # frappe.db.commit()
        # frappe.msgprint(f"新建{frappe.bold('锻坯')} {item_name}", indicator="green", alert=True)
        return new_doc
    else: 
        return frappe.get_cached_doc("Item", item_name)


def _semi_product_batch_convert(opts):
    print_blue("新建半成品产品批次信息")
    # if frappe.flags.wt_t1:
    #     bar_item = frappe._dict(bar_item)
    semi_doc_source = frappe.get_doc('Semi Product Manage', opts.spm_source)
    semi_doc_target = frappe.copy_doc(semi_doc_source, False)
    item_name = opts.finish_name
    semi_product_name, target_product_form = item_name.rsplit('_', 1)
    
    product_form_doc = frappe.get_cached_doc('Product Form', target_product_form)
    target_abbr = product_form_doc.abbr
    # batch_no = abbr + getseries(abbr, 3)
    # batch_no = parse_naming_series(target_abbr + '-.YY.MM.DD.-.###')
    batch_no = make_simi_product_batch_no(semi_product_name, target_abbr)
    # print_red(f'{product_form_doc=} {batch_no=} {semi_product_name=}')

    # basket_no有新使用的，清除掉其它使用次框号的
    if (opts.basket_in):
        # frappe.db.sql(f"update `tabSemi Product Manage` set basket_no = '' where basket_no = '{opts.basket_in}' and name != '{opts.spm_source}'")
        frappe.db.sql(f"update `tabSemi Product Manage` set basket_no = '' where basket_no = '{opts.basket_in}' ")

    # 新doc设置 件数，剩余数量，总数量，操作员，产品名称，批次号（自动？）
    #   仓库（根据目标产品形态设置），状态（缺省未使用），
    semi_doc_target.update({
        'batch_no': batch_no,
        'last_in_piece': opts.finish_qty,
        'remaining_piece': opts.finish_qty,
        'total_piece': opts.finish_qty,
        'semi_product_name': opts.finish_name,
        'employee': opts.employee,
        'product_form': target_product_form,
        'warehouse': product_form_doc.default_warehouse,
        'forge_batch_no': opts.forge_batch_no,
        'basket_in': opts.basket_in,
        'basket_no': opts.basket_in,
        'bbl_heat_no': opts.bbl_heat_no,
        'note': opts.op_note,
        'op_times': semi_doc_source.op_times + 1,
        'last_op_voucher': opts.name,
        # 'parent_batch_no': opts.spm_source,
        'parent_semi_product_manage': opts.spm_source,
        'old_parent': opts.spm_source,
        # 'status': '未使用', # default
        'op_mark': opts.op_mark,

    }).insert(ignore_permissions=True)
    
    source_remaining = semi_doc_source.remaining_piece - opts.finish_qty
    source_status = '用完' if source_remaining == 0 else '已使用'
    if source_remaining < 5 and source_remaining != 0:
        source_status = '余料' 
    semi_doc_source.update({
        'last_in_piece': 0,
        'last_out_piece': opts.finish_qty,
        'remaining_piece': source_remaining,
        'use_date': today(),
        'status': source_status,
        'last_op_voucher': opts.name,
        'basket_no': semi_doc_source.basket_in if source_remaining != 0 else '',
        'basket_in': semi_doc_source.basket_in if source_remaining != 0 else '',
        'is_group': 1,
    }).save()


      
    print_red('半成品批次管理，产品转化已完成')
    # todo 建操作记录
    return semi_doc_target.name

    # print_blue_pp(semi_doc_source.as_dict())
    # print_green_pp(semi_doc_target.as_dict())   



""" test info
import bbl_app.semi_product.doctype.semi_product_operate.semi_product_operate as spo
spo.spm_op(None)

sb.clear_db()
"""
