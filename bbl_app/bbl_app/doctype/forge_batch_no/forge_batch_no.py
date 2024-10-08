# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ForgeBatchNo(Document):
	pass



# def _make_forge_no_if_not_exist(forge_no):
#     # 新建锻造标识
#     if frappe.db.exists('Forge Batch No', forge_no):
#         return 
#     frappe.new_doc({
#         'doctype': 'Forge Batch No',
#         'forge_batch_no': forge_no,
#         'is_padding': 1
#     }).insert
#     # return doc