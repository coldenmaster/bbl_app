
import frappe
from frappe.utils.data import cint, now, today

from bbl_api.utils import print_blue, print_red, print_yellow

BBL_SEP = '-'


def make_simi_product_batch_no(product_name, form_abbr, find_times=5):
    # 寻找最后一个单然后序号+1，最多加5次
    date = today()
    batch_no_0 = form_abbr + BBL_SEP + date.replace('-', '')[2:]+ BBL_SEP + product_name[-6:] 
    # spm_last_doc_of_batch = frappe.get_last_doc('Semi Product Manage', filters={'name': ("like", f"{batch_no_0}%")})
    spm_last_docs = frappe.get_all('Semi Product Manage', 
                    filters={'name': ("like", f"{batch_no_0}%")}, 
                    limit_page_length=1, 
                    pluck="name")

    if not spm_last_docs:
        return batch_no_0 + BBL_SEP + '01'
    spm_last_doc_batch_no = spm_last_docs[0]
    idx = cint(spm_last_doc_batch_no.split(BBL_SEP)[-1]) + 1
    # print_yellow(idx)
    idx_str = f"{idx:02d}"
    batch_no = batch_no_0 + BBL_SEP + idx_str

    for i in range(find_times):
        if (frappe.db.exists('Semi Product Manage', {'name': batch_no})):
            idx += 1
            idx_str = f"{idx:02d}"
            batch_no = batch_no_0 + BBL_SEP + idx_str
        else:
            break
    # print_blue(spm_last_docs)
    # print_blue(idx)
    # print_blue(batch_no)
    return batch_no


""" 
import bbl_app.utils.frappe_func as ff
ff.make_simi_product_batch_no('4E', 'DP')
ff.make_simi_product_batch_no2('7.5B', 'LXZ/LX')
ff.search_batch_no_in_spm('DP-6240')
 """