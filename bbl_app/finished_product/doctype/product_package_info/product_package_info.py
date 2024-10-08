# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

from bbl_app.common.cp_qrcode import CpQrcode
from bbl_app.finished_product.doctype.finished_product_manage.finished_product_manage import make_ppm_from_barcode
import frappe
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from frappe.utils.data import sbool

from bbl_api.utils import _print_blue_pp, _print_green_pp, print_red, print_yellow


class ProductPackageInfo(Document):
    
    # def before_validate(self): 
    #     print_red('2 ProductPackageInfo before_validate')

    # def before_save(self):
    #     print_red('3 ProductPackageInfo before_save')
    #     # self.flags.ignore_links = True

    # def save(self):
    #     print_red('1 ProductPackageInfo save')
    #     # self.flags.ignore_links = True
    #     super().save()

    pass
    

_mock_data = {
    'cmd': 'bbl_app.finished_product.doctype.product_package_info.product_package_info.fetch_code_info',
    # 'code': 'BBL*NF05H*B2407IIJ152-1*0026',
    # 'code_type': 'BBL*ELSE',
    # 'code': 'X1250*3001011-NF05H***QZ0022409240109*1**7GMAGKCP',
    'code': '652670452409050946',
    'code_type': 'CUSTOMER',
    'enable_bbl_code': '0',
    'employee': 'Administrator',
    'package_no': '',
    'qty': '4'}
# _mock_data = {'customer_code': 'X1250*30JS09A-01011*20201008*QZ0022010080001*0RHAGNW5', 'bbl_code': '32513423', 'employee': 'Administrator', 'user': 'Administrator', 'cmd': 'bbl_app.machine_shop.doctype.product_scan.product_scan.send_back_data'}
@frappe.whitelist(allow_guest=True)
def fetch_code_info(**kwargs):
    """ 根据上传条码，新建|更新产品记录信息 """
    # print_blue(kwargs)
    if not kwargs:
        print_red("mock data 😁")
        kwargs = _mock_data #置入假数据

    kwargs = frappe._dict(kwargs)
    # _print_blue_pp(kwargs)

    if kwargs.code_type == 'BBL*BM':
        return

    # todo 根据扫描上来的条码，找到成品信息，or解析条码上的信息，返回给前端
    product_doc_name = None
    if (kwargs.code_type == "CUSTOMER"):
        name_list = frappe.get_list("Finished Product Manage", 
                            {'customer_barcode': kwargs.code},
                            pluck='name')
        # print_red(name_list) 是否取第一个合理？需要进一步判断选择吗？
        product_doc_name = name_list[0] if name_list else None
        if (not product_doc_name):
            fpm_padding_doc = make_ppm_from_barcode(kwargs.code)
            # fpm_padding_doc.insert(ignore_links=True)
            fpm_padding_doc.insert()
            # print_red(fpm_padding_doc.as_dict())
            product_doc_name = fpm_padding_doc.name
            # fpo_padding_doc 是否需要同时新建
    else :
        if frappe.db.exists("Finished Product Manage", kwargs.code):
            product_doc_name = kwargs.code
    
    if (not product_doc_name):
        frappe.errprint("未找到条码对应的成品信息。")
        return
    
    product_doc = frappe.get_doc("Finished Product Manage", product_doc_name)

    # print_yellow(f"{product_doc=}")
    frappe.db.commit()

    return product_doc

         

    # fpo_new_doc.submit()
    # frappe.db.commit()


""" test info
import bbl_app.finished_product.doctype.product_package_info.product_package_info as ppi
ppi.fetch_code_info()
"""