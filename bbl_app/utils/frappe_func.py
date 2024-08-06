
import frappe
from frappe.utils.data import today

from bbl_api.utils import print_blue, print_red

BBL_SEP = '-'

def make_simi_product_batch_no(product_name, form_abbr, date=today(), find_times=5):
    """ 
    -1.短棒料转锻坯是,name通用是: 简称-半成品名称（<=5位)-240807-01
    -2.判断名称序号办法:查询name包含 DP-4E-240807 的有几个,
    序号 = len + 1,转两位以上(三位应该会自动扩展),拼接成新批次号(name)
    """
    # batch_no_0 = form_abbr + BBL_SEP + product_name[-5:] + BBL_SEP + date.replace('-', '')[2:]
    batch_no_0 = form_abbr + BBL_SEP + date.replace('-', '')[2:]+ BBL_SEP + product_name[-4:] 
    doc_list = search_batch_no_in_spm(batch_no_0)
    print_red("data is:" + date)
    idx = f"{len(doc_list) + 1:02d}"
    batch_no = batch_no_0 + BBL_SEP + idx
    # print_red(batch_no)
    return batch_no

def search_batch_no_in_spm(batch_no): # 查询数据库中是否存在该批次号
    doc_list = frappe.get_all('Semi Product Manage', 
                    filters={'name': ("like", f"{batch_no}%")}, pluck='name')
    # print_blue(doc_list)
    return doc_list

""" 
import bbl_app.utils.frappe_func as ff
ff.make_simi_product_batch_no('4E', 'DP')
ff.search_batch_no_in_spm('DP-6240')
 """