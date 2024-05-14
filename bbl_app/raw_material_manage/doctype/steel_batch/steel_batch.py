# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document

from bbl_api.utils import print_blue, print_green, print_red


class SteelBatch(Document):
    
    def save(self):
        print_red('steel save')
        print_blue(self)
        print_blue(vars(self))
        self.create_heat_no()
        super().save()
        self.create_batch_no()
        self.create_sabb()
        
    
    """
        这个自动创建功能现在是测试，
        关系太多，可能应该使用时手动建立
    """  
    # 建号批次号后建SABB bundle
    def create_sabb(self):
        # print_green('steel create_sabb')
        sabb_no = 'YGRK-' + self.batch_no
        if (not frappe.db.exists('Serial and Batch Bundle', sabb_no)):
            print("新建SABB")
            sabb_doc = frappe.get_doc({
                'doctype': 'Serial and Batch Bundle',
                # 'name': sabb_no,
                'naming_series': sabb_no,
                'company': '百兰车轴',
                'item_code': self.raw_name,
                'has_batch_no': 1,
                'warehouse': '原钢堆场 - 百兰',
                'type_of_transaction': 'Inward',
                # weight2, weight3 需要时员工手动新建
                'total_qty': self.weight, 
                'voucher_type': 'Purchase Receipt',
            })
            sabb_doc.append('entries', {
                'batch_no': self.batch_no,
                'qty': self.weight,
            })
            sabb_doc.insert(set_name=sabb_no, ignore_permissions=True)
            frappe.db.commit()
            frappe.msgprint(f"新建 SABB: {sabb_no}", indicator="green", alert=True)
            # frappe.throw(f"新建 SABB: {sabb_no}")
            
    
    def create_heat_no(self):
        # print_green('steel create_heat_no')
        # 1.检查是否有此炉号，没有则新建
        if (not frappe.db.exists('Heat No', self.heat_no)):
            # print("炉号不存在，新建")
            heat_no_doc = frappe.get_doc({
                'doctype': 'Heat No',
                'heat_no': self.heat_no,
                'product_company': self.product_company,
                'raw_name': self.raw_name,
                'steel_grade': self.steel_grade,
                'diameter': self.diameter,
                'contract_no': self.contract_no,
                'standard': self.standard,
            })
            heat_no_doc.insert(ignore_permissions=True)
            frappe.db.commit()
            frappe.msgprint(f"新建炉号 {self.heat_no}", indicator="green", alert=True)
            
            
    # 2.新建完成后，再建立一个新产品的批次号
    def create_batch_no(self):
        if (not frappe.db.exists('Batch', self.batch_no)):
            self.create_item()
            # print("批次号不存在，新建")
            batch_no_doc = frappe.get_doc({
                'doctype': 'Batch',
                'batch_id': self.batch_no,
                'item': self.raw_name,
            })
            batch_no_doc.insert(ignore_permissions=True)
            frappe.db.commit()
            frappe.msgprint(f"新建物料批号 {self.batch_no}", indicator="green", alert=True)
    
    def create_item(self):
        if (not frappe.db.exists('Item', self.raw_name)):
            # print("此原材料不存在，新建")
            new_item_doc = frappe.get_doc({
                'doctype': 'Item',
                'item_code': self.raw_name,
                'item_group': '原材料',
                'stock_uom': 'kg',
                'has_batch_no': 1,
            })
            new_item_doc.insert(ignore_permissions=True)
            frappe.db.commit()
            frappe.msgprint(f"新建原材料 {self.raw_name}", indicator="green", alert=True)
            
            
        
    # def before_insert(self):
    #     print_green('steel before_insert')

    # def before_validate(self):
    #     print_green('steel before_validate')
    
    # def validate(self):
    #     print_green('steel validate')
    
    # def before_save(self):
    #     print_green('steel before_save')
                            
        
        
    

