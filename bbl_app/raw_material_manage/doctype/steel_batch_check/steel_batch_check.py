# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document

from bbl_api.utils import print_blue, print_blue_pp, print_cyan, print_green


class SteelBatchCheck(Document):

    def before_validate(self):
        # print_green('SteelBatchCheck before validate')
        self.set_status()
        
    def set_status(self):
        if not frappe.db.exists("Steel Batch", self.batch_no):
            self.status = "无此批号"
            return
        bs_doc = frappe.get_doc("Steel Batch", self.batch_no)
        # print_blue_pp(bs_doc)
        if bs_doc.status == "出完":
            self.status = "出完"
        elif bs_doc.warehouse_area == self.warehouse_area:
            self.status = "在库"
        else:
            self.status = bs_doc.warehouse_area
        



""" console cmd
import bbl_app.raw_material_manage.doctype.steel_batch_check.steel_batch_check as sb
sb.check_process(
    **{
        # "area": '原钢暂存库0',
        "area": '南1区',
    }
)
docs = frappe.get_all("Steel Batch")
"""

# /api/method/bbl_app.raw_material_manage.doctype.steel_batch_check.steel_batch_check.check_process?area=南1区
@frappe.whitelist()
def check_process(**args):
    area = args["area"]
    filter = {
        "warehouse_area": area,
        "status": ["!=", "出完"],
        }
    if (area == '全部0'):
        filter.pop("warehouse_area")

    sb_list = frappe.db.get_list("Steel Batch", filter)
    sb_list = [x.name for x in sb_list]
    sbc_list = frappe.db.get_list("Steel Batch Check", filter)
    sbc_list = [x.name for x in sbc_list]
    
    only_in_sb = list_diff(sb_list, sbc_list)
    only_in_sbc = list_diff(sbc_list, sb_list)
    
    rt = {
        "sb_cnt": len(sb_list),
        "sbc_cnt": len(sbc_list),
        "both_in": len(sb_list) - len(only_in_sb),
        "only_in_sb": list(only_in_sb),
        "only_in_sbc": only_in_sbc
    }
    return rt

def list_diff(list1, list2):
    # 获取list1中不在list2中的元素
    set1 = set(list1)
    set2 = set(list2)
    return set1 - set2

# http://dev2.localhost:8000/api/method/bbl_app.raw_material_manage.doctype.steel_batch_chech.clear_sb_check_db
# /api/method/bbl_app.raw_material_manage.doctype.steel_batch.steel_batch_chech.clear_sb_check_db?area=南1区
@frappe.whitelist()
def clear_sb_check_db(**args):
    # print('bakend clear_sb_check_db', type(args), args)
    area = args["area"]
    filter = {"warehouse_area": area}
    if (area == '全部0'):
        filter = None
    rt = frappe.db.delete("Steel Batch Check", filter)
    print_blue(f"{rt}条数据被删除")
    return rt
