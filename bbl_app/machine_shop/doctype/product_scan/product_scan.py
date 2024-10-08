# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

from bbl_app.common.cp_qrcode import CpQrcode
from bbl_app.finished_product.doctype.finished_product_manage.finished_product_manage import make_ppm_from_barcode
import frappe
from frappe.model.document import Document
from frappe.utils.data import add_to_date, now_datetime

from bbl_api.utils import USERS_IDS, WxcpApp, print_blue, print_blue_pp, print_red, send_wx_msg_q


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
    # print_blue(kwargs)
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
    customer_cp_qrcode = CpQrcode(kwargs.customer_code)
    cus_code_info = customer_cp_qrcode.parse_data()

    kwargs.update({
        'customer': cus_code_info.get("company"),
        'cus_code_date': cus_code_info.get("code_date"),
        'cus_batch_no': cus_code_info.get("forge_batch"),
        'cus_product_code': cus_code_info.get("product_code"),
        'cus_flow_id': cus_code_info.get("flow_id"),
        'drawing_id': cus_code_info.get("drawing_id"),
        # 'product_name': cus_code_info.get("cus_product_name"),
    })

    bbl_code_info = {}
    if kwargs.get('bbl_code'):
        bbl_code_info = CpQrcode(kwargs.get('bbl_code')).parse_data()
        kwargs.update({
            # 'product_name': kwargs.get('product_name') or bbl_code_info.get("product_code") 
            #     or cus_code_info.get('product_code') or "未识别",
            'bbl_flow_id': bbl_code_info.get("flow_id"),
            'forge_batch_no' : bbl_code_info.get("forge_batch"),
        })
    kwargs['product_name'] = bbl_code_info.get("product_code") or cus_code_info.get('drawing_id') \
                or cus_code_info.get('product_code') or "未识别",
    print_blue_pp(kwargs)
    try:
        new_doc = frappe.get_doc(kwargs)
        new_doc.insert(ignore_permissions=True)
        # todo  产品扫描后，补充产品信息，原因同上。以后改版。
        fpm_padding_doc = make_ppm_from_barcode(kwargs.customer_code, kwargs.bbl_code)
        fpm_padding_doc.insert(ignore_links=True)
        frappe.db.commit()
        
         
    except frappe.exceptions.DuplicateEntryError as e:
        print_red("DuplicateEntryError exption")
        frappe.msgprint(f"客户二维码重复:\n{kwargs.customer_code}", raise_exception=True)

    return kwargs.get('customer_code')




def product_qrcode_daily_statistics(delta:int = 0):
    """ 
    测长短制作每日报告:仿造电表，
    日期，报告类型，产品，数量，误差+，误差-数量，误差百分比
    """
    report_type = '测长短'
    report_period = '日报'
    now_time = now_datetime()
    now_time = add_to_date(now_time, days=delta)
    # end_time = now_time.replace(hour=0, minute=0, second=0, microsecond=0)
    end_time = now_time
    start_time = add_to_date(end_time, days=-1)
    product_name_cnt = _get_list(start_time, end_time)
    report = {
        # 'report_type': report_type,
        # 'report_period': report_period,
        'start_time': start_time,
        'end_time': end_time,
        'name_cnt': product_name_cnt
    }
    rt_str = _report_str(report)
    send_wx_msg_q(rt_str, app_name=WxcpApp.PRODUCT_APP.value, user_ids=USERS_IDS.get('product_scan_code', ''))
    # send_wx_msg_q(rt_str, app_name=WxcpApp.PRODUCT_APP.value, user_ids=USERS_IDS.get('admins', ''))
    # send_wechat_msg_admin_site(rt_str)
    # print_green(rt_str)


def _get_list(start_time, end_time):
    docs = frappe.get_list('Product Scan', 
        filters={
            'creation': ['between', [start_time, end_time]],
            # 'error_length': ['<', 20]
        }, 
        fields=['product_name', 'customer'])
    product_names = [d.product_name for d in docs]
    product_name_set = set(product_names)
    # print_green(product_name_set)
    name_cnt = { name: product_names.count(name) for name in product_name_set}
    name_cnt['合计'] = len(product_names)
    # _print_blue_pp(name_cnt)
    return name_cnt

def _report_str(report):
    rt_str = (
        '<<机加工扫码产量日报>>\n------\n'
        f'开始时间: {report.get("start_time").strftime("%Y-%m-%d %H:%M:%S")}\n'
        f'结束时间: {report.get("end_time").strftime("%Y-%m-%d %H:%M:%S")}\n------'
    )
    for name, cnt in report.get("name_cnt").items():
        rt_str += f'\n{name}: {cnt} 根'
    # rt_str += '\n------'
    return rt_str


""" test info
import bbl_app.machine_shop.doctype.product_scan.product_scan as ps
ps.product_qrcode_daily_statistics()
"""