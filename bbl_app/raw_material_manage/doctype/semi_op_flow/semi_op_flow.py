# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class SemiOpFlow(Document):
        
    def on_trash(self):
        if ("Administrator" != frappe.session.user ):
            frappe.throw("只有管理员才能删除此文档")