# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

import frappe

from frappe.utils.nestedset import NestedSet


class OperationTree(NestedSet):
	pass


@frappe.whitelist()
def get_children(doctype, parent="", **filters):
    print(doctype, parent, filters)
    return _get_children(doctype, parent)


def _get_children(doctype, parent="", ignore_permissions=False):
	parent_field = "parent_" + frappe.scrub(doctype)
	filters = [[f"ifnull(`{parent_field}`,'')", "=", parent], ["docstatus", "<", 2]]

	meta = frappe.get_meta(doctype)

	return frappe.get_list(
		doctype,
		fields=[
			"name as value",
			"{} as title".format(meta.get("title_field") or "name"),
			"is_group as expandable",
		],
		filters=filters,
		order_by="name",
		ignore_permissions=ignore_permissions,
	)
   