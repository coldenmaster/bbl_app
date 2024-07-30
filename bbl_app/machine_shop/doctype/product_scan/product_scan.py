# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

from bbl_app.common.cp_qrcode import CpQrcode
import frappe
from frappe.model.document import Document

from bbl_api.utils import print_blue, print_blue_pp, print_red


class ProductScan(Document):
        
    def on_trash(self):
        if ("Administrator" != frappe.session.user ):
            frappe.throw("只有管理员才能删除此文档")



_mock_data = {}
# _mock_data = {'customer_code': 'X1250*30JS09A-01011*20201008*QZ0022010080001*0RHAGNW5', 'bbl_code': '32513423', 'employee': 'Administrator', 'user': 'Administrator', 'cmd': 'bbl_app.machine_shop.doctype.product_scan.product_scan.send_back_data'}
# # http://dev2.localhost:8000/api/method/bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry?scan_barcode=123
@frappe.whitelist(allow_guest=True)
def send_back_data(**kwargs):
    """ 
    前端上传产品扫描的二维码数据:
    """
    print_blue(kwargs)
    if not kwargs:
        print_red("mock data 😁")
        kwargs = _mock_data #置入假数据

    kwargs = frappe._dict(kwargs)
    # 检查客户二维码是否已经存在
    # if frappe.db.exists("Product Scan", {"customer_code": kwargs.customer_code}):
    if frappe.db.exists("Product Scan", kwargs.customer_code):
        # frappe.throw(f"客户二维码已经存在: {kwargs.customer_code}")
        # frappe.msgprint(f"客户二维码已经存在:\n{kwargs.customer_code}", raise_exception=True)
        frappe.msgprint(f"客户二维码已经存在:\n{kwargs.customer_code}")


    kwargs.doctype = "Product Scan"
    cus_code_info = CpQrcode(kwargs.customer_code).parse_data()
    kwargs.update({
        'customer': cus_code_info.get("company"),
        'cus_code_date': cus_code_info.get("code_date"),
        'cus_batch_no': cus_code_info.get("forge_batch"),
        'cus_product_code': cus_code_info.get("product_code"),
        'cus_flow_id': cus_code_info.get("flow_id"),
        'product_name': cus_code_info.get("cus_product_name", ""),
    })
    if kwargs.get('bbl_code'):
        bbl_code_info = CpQrcode(kwargs.bbl_code).parse_data()
        kwargs.update({
            'product_name': kwargs.get('product_name') or bbl_code_info.get("cus_product_name", "code"),
            'bbl_flow_id': bbl_code_info.get("flow_id"),
        })
    print_blue_pp(kwargs)
    try:
        new_doc = frappe.get_doc(kwargs)
        new_doc.insert(ignore_permissions=True)
        frappe.db.commit()
        
         
    except frappe.exceptions.DuplicateEntryError as e:
        print_red("DuplicateEntryError exption")
        frappe.msgprint(f"客户二维码重复:\n{kwargs.customer_code}", raise_exception=True)


    return kwargs.get('customer_code')


""" test info
import bbl_app.machine_shop.doctype.product_scan.product_scan as ps
sb.clear_db()
"""