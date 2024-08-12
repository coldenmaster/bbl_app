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

@frappe.whitelist()
def search_widget_wt(*args, **kwargs):
    search_widget(*args, **kwargs)


""" 
import bbl_app.semi_product.doctype.semi_product_manage.semi_product_manage as spm
spm.get_children("Semi Product Manage")
 """
