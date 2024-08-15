# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

import frappe
from frappe.desk.search import search_widget
from frappe.model.document import Document

from bbl_api.utils import _print_green_pp, print_blue, print_red, print_yellow


class SemiProductManage(Document):
        
    def on_trash(self):
        if ("Administrator" != frappe.session.user ):
            frappe.throw("只有管理员才能删除此文档")


@frappe.whitelist()
def get_children(doctype, parent="", **filters):
    print(doctype, parent, filters)
    # print_yellow(filters)
    return _get_children(doctype, parent, **filters)


def _get_children(doctype, parent="", ignore_permissions=False, **filters):
    parent_field = "parent_" + frappe.scrub(doctype)
    print_blue(filters)
    filters = _make_filters(**filters)
    filters += [[f"ifnull(`{parent_field}`,'')", "=", parent], ["docstatus", "<", 2]]
    _print_green_pp(filters)

    meta = frappe.get_meta(doctype)

    return frappe.get_list(
        doctype,
        # fields=[
        #     "name as value",
        #     "{} as title".format(meta.get("title_field") or "name"),
        #     "is_group as expandable",
        #     "total_piece"
        # ],
            # "\t CONCAT(`{}`, '/',`total_piece`,'根') as title".format(meta.get("title_field") or "name"),
        fields=[
            "name as value",
            "\n CONCAT(`{}`, '/', `remaining_piece`, '/',`total_piece`,'根') as title".format(meta.get("title_field") or "name"),
            "is_group as expandable",
            "remaining_piece",
            "total_piece",
            "for_date",
        ],
        filters=filters,
        # order_by="name",
        # order_by="for_date desc",
        order_by="creation desc",
        ignore_permissions=ignore_permissions,
        
    )

def _make_filters(**kwargs):
    filters = []
    # del kwargs["cmd"]
    # for key, value in kwargs.items():
    #     if value:
    #         filters.append([key, "=", value])
    if kwargs.get('semi_product', None):
        filters.append(["semi_product", "=", kwargs['semi_product']])
    if kwargs.get('root_item', None) and kwargs.get('is_root', False):
        filters.append(["name", "=", kwargs['root_item']])
    if kwargs.get('for_date', None):
        filters.append(["for_date", ">=", kwargs['for_date']])

    return filters


# this is called by the search box

def search_widget_del(
	doctype: str,
	txt: str,
	query: str | None = None,
	searchfield: str | None = None,
	start: int = 0,
	page_length: int = 10,
	filters: str | None | dict | list = None,
	filter_fields=None,
	as_dict: bool = False,
	reference_doctype: str | None = None,
	ignore_user_permissions: bool = False,
):
    pass

# todo no_use del
@frappe.whitelist()
def search_widget_wt(*args, **kwargs):
    search_widget(*args, **kwargs)




# mock_obj = {}
# mock_obj = {'forge_batch_no': 'pch123456', 'semi_product_name': '4E_打磨正品', 'item_names': '["DM/ZP-240814-4E-01","DM/ZP-240808-4E-03"]', 'item_qtys': '[22,2]', 'parent_item': '{"name":"DM/ZP-240814-4E-01","owner":"Administrator","creation":"2024-08-14 16:42:18","modified":"2024-08-14 16:42:18","modified_by":"Administrator","_user_tags":null,"_comments":null,"_assign":null,"_liked_by":null,"docstatus":0,"idx":35,"batch_no":"DM/ZP-240814-4E-01","semi_product_name":"4E_打磨正品","raw_heat_no":"V12403619","forge_batch_no":"pch123456","remaining_piece":22,"basket_in":"22","status":"未使用","product_form":"打磨正品","operation":"打磨","workshop":"锻造车间","sub_workshop":"打磨车间","semi_product":"4E","bbl_heat_no":null,"is_group":0,"_idx":1}', 'qty_max': '22', 'qty_total': '24', 'cmd': 'bbl_app.semi_product.doctype.semi_product_manage.semi_product_manage.send_batch_merge_data'}

# # http://dev2.localhost:8000/api/method/bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar.product_out?scan_barcode=123
# @frappe.whitelist()
# def send_batch_merge_data(**kwargs):
#     print_red("srb work_order_done No_2")
#     print_blue(kwargs)
#     if not kwargs:
#         print_red("mock data 😁")
#         kwargs = mock_obj #置入假数据
#     kwargs = frappe._dict(kwargs)
#     # _print_green_pp(kwargs)

#     # bar_bacth_no = kwargs.get("name")
#     # bar_bacth_qty = cint(kwargs.get("out_piece"))
#     # # forge_batch_no = kwargs.get("forge_batch_no")
#     # # 1. make sabb
#     # sabb_name = create_bar_sabb_for_wo_done(kwargs.raw_bar_name, bar_bacth_qty, (bar_bacth_no, bar_bacth_qty))

#     # # 2. make stock entry
#     # se_doc = create_stock_entry_for_wo_done(kwargs.work_order, sabb_name, bar_bacth_qty)
#     # return kwargs.get('work_order')
#     # # 3.完成后，修改短棒料的状态为‘锻造车间wip’,修改短棒料生产数量（在stock entry 的hook中完成）















""" 
import bbl_app.semi_product.doctype.semi_product_manage.semi_product_manage as spm
spm.get_children("Semi Product Manage")
 """
