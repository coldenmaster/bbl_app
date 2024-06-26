# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document

from bbl_api.utils import print_red


class ShortRawBar(Document):
    pass

    def on_trash(self):
        print_red("srb on_trash")
        print_red(frappe.session.user)
        if ("Administrator" != frappe.session.user ):
            frappe.throw("只有管理员才能删除此文档")