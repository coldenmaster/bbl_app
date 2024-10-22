# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

from bbl_app.common.cp_qrcode import CpQrcode
import frappe
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from frappe.utils.data import sbool, today

from bbl_api.utils import _print_blue_pp, print_blue, print_green, print_red, print_yellow


class FinishedProductManage(Document):
	pass


_mock_data = {
 'bbl_code': 'abc1234567891Ws',
 'cmd': 'bbl_app.finished_product.doctype.finished_product_manage.finished_product_manage.send_back_data',
#  'employee': 'Administrator',
 'employee': '生产用户',
 'op_to': '成品油漆',
 'product_name': '3001101A007A0',
 'semi_product_manage': 'DP/DJ-240919-D30NB-07',
#  'spm_flag': 'true'}
#  'op_to': '铣上下面',
 'op_to': '机加工',
 'spm_flag': 'false'}

# _mock_data = {'customer_code': 'X1250*30JS09A-01011*20201008*QZ0022010080001*0RHAGNW5', 'bbl_code': '32513423', 'employee': 'Administrator', 'user': 'Administrator', 'cmd': 'bbl_app.machine_shop.doctype.product_scan.product_scan.send_back_data'}
# # http://dev2.localhost:8000/api/method/bbl_app.raw_material_manage.doctype.steel_batch.steel_batch.make_out_entry?scan_barcode=123
@frappe.whitelist(allow_guest=True)
def send_back_data(**kwargs):
    """ 根据上传条码，新建|更新产品记录信息 """
    # print_blue(kwargs)
    if not kwargs:
        print_red("mock data 😁")
        kwargs = _mock_data #置入假数据
        # kwargs['bbl_code'] = kwargs['bbl_code'] + frappe.utils.random_string(2)

    kwargs = frappe._dict(kwargs)
    _print_blue_pp(kwargs)
    print_yellow(f"{kwargs.spm_flag=}")
    # todo 检查BBL二维码是否已经存在，是新建还是更新信息？需要这里判断
    # todo 1.如果有spm_flag, 则是新建产品条码，查询bbl_code，如果重复，则异常（）；否则，新建
    spm_doc = None
    if sbool(kwargs.spm_flag):
        spm_doc = _make_new_fpm(kwargs)
        _subtract_semi_product_manage_qty(kwargs)

    else :
        # 更新产品条码
        print_yellow("更新产品条码")
        _add_fpm_item(kwargs)
        pass


    # todo 2.如果没有spm_flag, 则是更新产品条码，查询bbl_code，如果不存在，则异常；否则，更新
    # if frappe.db.exists("Product Scan", {"customer_code": kwargs.customer_code}):
    # if frappe.db.exists("Finished Product Manage", kwargs.bbl_code):
    #     # frappe.throw(f"客户二维码已经存在: {kwargs.customer_code}")
    #     # frappe.msgprint(f"客户二维码已经存在:\n{kwargs.customer_code}", raise_exception=True)
    #     frappe.msgprint(f"二维码已经存在:\n{kwargs.bbl_code}")
    #     return "sb exist"
    
    # spm_doc = frappe.get_doc("Semi Product Manage", kwargs.bbl_code)
    # fpm_new_doc = frappe.new_doc("Finished Product Manage")
    # fpm_new_doc.update({
    #     'bbl_code': kwargs.bbl_code,
    #     'employee': kwargs.employee,
    #     'operation': kwargs.op_to,
    #     'product_name': kwargs.scan_code,

    # })
    # fpm_new_doc.update(kwargs).save()

    # 新建成品加工单
    
    _make_fpo(kwargs)

    frappe.db.commit()
    return "sb ok"


def _make_new_fpm(kwargs):
        print_yellow("新建产品条码")
        if frappe.db.exists("Finished Product Manage", kwargs.bbl_code):
            frappe.throw(f"BBL产品二维码已经存在:\n{kwargs.bbl_code}")
        spm_doc = frappe.get_doc("Semi Product Manage", kwargs.semi_product_manage)
        # todo 检查还有没有，没有则异常，有则减一
        if spm_doc and spm_doc.remaining_piece <= 0:
            frappe.throw(f"此半成品批次，已经用完:\n{kwargs.semi_product_manage}")
        spm_status = "打码中" if spm_doc.remaining_piece > 1 else "已用完"
        spm_doc.update({
            'remaining_piece': spm_doc.remaining_piece - 1,
            'status': spm_status,
        })
        # _print_blue_pp(spm_doc.as_dict())
        fpm_new_doc = frappe.new_doc("Finished Product Manage")
        op_list = [{
            'op_to': kwargs.op_to,
            'employee': kwargs.employee,
            'for_date': frappe.utils.now(),
        }]
        fpm_new_doc.update({
            'bbl_code': kwargs.bbl_code,
            'customer_code': None, # 二维码关联使用
            'other_code': None,
            'operation': kwargs.op_to,
            'employee': kwargs.employee,
            'product_name': kwargs.product_name, # spm上没有，需要前端提供
            'last_op_voucher': None,
            'status': '入油漆',      # '新建的都表示入了油漆,
            'product_stage': '',
            # 'product_grade': kwargs.op_to,
            'stock_area': '油漆车间',   # todo 决定数据来源
            'semi_product': spm_doc.semi_product,
            'forge_batch_no': spm_doc.forge_batch_no,
            'employee_last': None,
            'package_no': None, # 打包使用
            'package_qty': 0,
            'semi_product_batch': spm_doc.batch_no,
            'batch_qty': spm_doc.total_piece,
            'raw_name': spm_doc.raw_name,
            'raw_heat_no': spm_doc.raw_heat_no,
            'bbl_heat_no': spm_doc.bbl_heat_no,
            'product_type': spm_doc.product_type,
            # 'product_line': spm_doc.None,
            'weight': spm_doc.weight,
            'customer_abbr': None,
            'op_list': op_list,
            # 'is_over': 0,
        })
        fpm_new_doc.insert()
        return spm_doc

def _add_fpm_item(kwargs):
    print_yellow("into _add_fpm_item")
    fpm_name = kwargs.bbl_code
    if (not frappe.db.exists("Finished Product Manage", fpm_name)):
        frappe.throw(f"此条码，成品不存在:\n{fpm_name}")
    fpm_doc = frappe.get_doc("Finished Product Manage", fpm_name)
    # todo 检查op_to有没有重复，有则异常，通过开关可以进行重复工序记录
    op_name_list = [fpm_item.op_to for fpm_item in fpm_doc.op_list]
    if kwargs.op_to in op_name_list and not kwargs.enable_op_repeat:
        frappe.throw(f"工序重复:\n{kwargs.op_to}@{fpm_name}")
    op_list = fpm_doc.op_list + [{
        'op_to': kwargs.op_to, 
        'employee': kwargs.employee,
        'for_date': frappe.utils.now(),
    }]
    fpm_doc.update({
        'operation': kwargs.op_to, 
        'op_list': op_list,
    })
    fpm_doc.save()

def _subtract_semi_product_manage_qty(kwargs):
    print_yellow("减半成品批次")
    spm_doc = frappe.get_doc("Semi Product Manage", kwargs.semi_product_manage)
    remaining_qty = spm_doc.remaining_piece - 1
    if remaining_qty < 0:
        frappe.throw(f"此半成品批次，已经用完:\n{kwargs.semi_product_manage}")
    status = '已使用' if remaining_qty > 5 else ('余料' if remaining_qty > 0 else "用完")
    spm_doc.update({
        'remaining_piece': spm_doc.remaining_piece - 1,
        'status': status,
    })
    spm_doc.save()

def _make_fpo(kwargs):
    # 没有了，放在spm item中记录, 或者看以后如果需要submit功能，再创建此文档
    # semi_product = spm_doc.semi_product if spm_doc else None
    # fpo_new_doc = frappe.new_doc('Finished Product Operate')
    # fpo_new_doc.update({
    #     'bbl_code': kwargs.bbl_code,
    #     'product_name': kwargs.product_name,
    #     'op_to': kwargs.op_to,
    #     'op_from': None,
    #     'employee': kwargs.employee,
    #     # 'for_date': datetime.date(2024, 9, 22),
    #     'op_mark': None,
    #     'production_line': None,
    #     'product_grade': None,
    #     'semi_product': semi_product,
    # })
    # fpo_new_doc.submit()
    pass




def make_fpm_from_barcode(customer_code, bbl_code=None):
    """
    如果扫描板簧码没有百兰码，新建一个产品信息（因为前面工序不齐，临时padding处理）
    """
    # 增加字段is_padding，用于标识该产品是否为补录
    cus_code_info = frappe._dict(CpQrcode(customer_code).parse_data())
    bbl_code_info = frappe._dict(CpQrcode(bbl_code).parse_data() if bbl_code else {})
    print_blue(cus_code_info)
    # print_blue(bbl_code_info)
    # _print_green_pp(cus_code_info)
    # 修正产品名称
    semi_product_name = (
        bbl_code_info.product_name or 
        cus_code_info.product_name  or
        cus_code_info.product_code  or
        cus_code_info.cus_product_name or  
        ''
    )
    if '-' in semi_product_name:
        semi_product_name = semi_product_name.split('-')[1]
    # 寻找产品名称
    product_name_end = semi_product_name[-5:]
    print_red(f'{product_name_end = }')
    li = frappe.get_list('Product Name',
                        filters={
                            'product_name': ['like', '%' + product_name_end + '%'],
                        }, pluck='name') if product_name_end else []
    # print_red(li)
    product_name = li[0] if len(li) else '无名称'
    # 寻找半成品名称
    if (product_name_end):
        li = frappe.get_list('Semi Product',
                        filters={
                            'semi_product_name': ['like', '%' + product_name_end + '%'],
                        }, pluck='name')
        if len(li) > 0:
            semi_product_name = li[0]
        else:
            _make_semi_product_if_not_exist(semi_product_name)
    else:
        semi_product_name = '无名称'



    # 新建锻造标识
    forge_batch_no = bbl_code_info.forge_batch or cus_code_info.forge_batch
    if not bbl_code:
        bbl_code = make_autoname('BBL-CP-PAD-.YYYY.MM.DD.-.###', 'Finished Product Manage') 
        operation = '打包'
        status = '已打包'
    else:
        operation = '扫码'
        status = '入机加工'
    
    _make_forge_no_if_not_exist(forge_batch_no)
    fpm_padding_doc = frappe.get_doc({
        'doctype': 'Finished Product Manage',
        'bbl_code': bbl_code,
        # 'naming_series': 'BBL*CP*PAD*####',
        'customer_barcode':customer_code,
        'customer': cus_code_info.company,
        'semi_product': semi_product_name,
        'product_name': product_name,
        'forge_batch_no': forge_batch_no,
        # 'employee': kwargs.employee,
        'operation': operation,
        'status': status,
        'is_padding': 1,

    })
    
    return fpm_padding_doc


def _make_forge_no_if_not_exist(forge_batch_no):
    # 新建锻造标识
    if (not forge_batch_no) or frappe.db.exists('Forge Batch No', forge_batch_no):
        return 
    frappe.get_doc({
        'doctype': 'Forge Batch No',
        'forge_batch_no': forge_batch_no,
        'is_padding': 1,
    }).insert()
    # return doc

def _make_semi_product_if_not_exist(semi_product_name):
    if (not semi_product_name) or frappe.db.exists('Semi Product', semi_product_name):
        return 
    frappe.get_doc({
        'doctype': 'Semi Product',
        'semi_product_name': semi_product_name,
        'disabled': 1,
    }).insert()
    # return doc



""" test info
import bbl_app.finished_product.doctype.finished_product_manage.finished_product_manage as fpm
fpm.send_back_data()
fpm.make_fpm_from_barcode('X1250*3001011-NF05H***QZ0022409240102*1**7GMAGAU8', 'BBL*NF05H*B2407IIJ152-1*0001')
"""