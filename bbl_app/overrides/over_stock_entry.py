import json
from bbl_app.utils.frappe_func import make_simi_product_batch_no
from bbl_app.utils.utils import safe_json_loads_from_str
from erpnext.stock.doctype.stock_entry.stock_entry import StockEntry
import frappe
from frappe import _
from frappe.utils.data import cint, comma_or, cstr, flt, now, today
from bbl_api.utils import _print_blue_pp, print_blue, print_cyan, print_green, print_green_pp, print_red, print_yellow



class CustomStockEntry(StockEntry):
    # print_green('自定义 StockEntry 加载 1')
    def on_submit(self):
        print_green('CustomStockEntry: on_submit 运行自定义代码->')
        print_green(self.stock_entry_type)
        # _print_green_pp(self.as_dict())
        # print('on_submit 传参 self 1  is:\n', self.as_dict())
        # print('on_submit 传参 self 2  is:\n', self.items)
        # print('on_submit 传参 self 3  is:\n', self.items[0].as_dict)
        if self.stock_entry_type == '原材料下料出库':
            process_steel_batch(self)
            create_raw_bar(self)
        if self.stock_entry_type == 'Manufacture' and '锻坯登记' in self.bom_no:
        # if self.stock_entry_type == 'Material Transfer for Manufacture' and '锻坯登记' in self.bom_no:
            process_bar_to_forge(self)
        if self.stock_entry_type == 'Repack':
            process_srb_change_name(self)
        if self.stock_entry_type == 'Wip Retrieve':
            process_srb_wip_retrieve(self)
        super().on_submit()

    def on_update(self):
        super().on_update()
            
    def on_cancel(self):
        super().on_cancel()
    
    def on_trash(self):
        print_red("se on_trash()")
        if self.stock_entry_type == '原材料下料出库':
            restore_steel_batch_status(self)
        return super().on_trash()
        

    def validate_purpose(self):
        valid_purposes = [
            "Material Issue",
            "Material Receipt",
            "Material Transfer",
            "Material Transfer for Manufacture",
            "Manufacture",
            "Repack",
            "Send to Subcontractor",
            "Material Consumption for Manufacture",
            "Bbl Not Op"
        ]

        if self.purpose not in valid_purposes:
            frappe.throw("wt_over:" + _("Purpose must be one of {0}").format(comma_or(valid_purposes)))

        if self.job_card and self.purpose not in ["Material Transfer for Manufacture", "Repack"]:
            frappe.throw(
                _(
                    "For job card {0}, you can only make the 'Material Transfer for Manufacture' type stock entry"
                ).format(self.job_card)
            )


# se_doc = {'name': 'MAT-STE-2024-00189', 'owner': 'Administrator', 'creation': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified_by': 'Administrator', 'docstatus': 0, 'idx': 0, 'naming_series': 'MAT-STE-.YYYY.-', 'stock_entry_type': '原材料下料出库', 'outgoing_stock_entry': None, 'purpose': 'Bbl Not Op', 'add_to_transit': 0, 'work_order': None, 'purchase_order': None, 'subcontracting_order': None, 'delivery_note_no': None, 'sales_invoice_no': None, 'pick_list': None, 'purchase_receipt_no': None, 'company': '百兰车轴', 'posting_date': datetime.date(2024, 6, 17), 'posting_time': datetime.timedelta(seconds=58522, microseconds=524936), 'set_posting_time': 0, 'inspection_required': 0, 'apply_putaway_rule': 0, 'from_bom': 0, 'use_multi_level_bom': 1, 'bom_no': None, 'fg_completed_qty': 0.0, 'process_loss_percentage': 0.0, 'process_loss_qty': 0.0, 'from_warehouse': None, 'source_warehouse_address': None, 'source_address_display': None, 'to_warehouse': None, 'target_warehouse_address': None, 'target_address_display': None, 'scan_barcode': None, 'total_outgoing_value': 2720.0, 'total_incoming_value': 2720.0, 'value_difference': 0.0, 'total_additional_costs': 0.0, 'supplier': '大冶特钢', 'supplier_name': None, 'supplier_address': None, 'address_display': None, 'project': None, 'select_print_heading': None, 'letter_head': None, 'is_opening': 'No', 'remarks': None, 'per_transferred': 0.0, 'total_amount': 5440.0, 'job_card': None, 'amended_from': None, 'credit_note': None, 'is_return': 0, 'doctype': 'Stock Entry', 'additional_costs': [], 'items': [{'name': 'upg7dlocrt', 'owner': 'Administrator', 'creation': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified_by': 'Administrator', 'docstatus': 0, 'idx': 1, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': '原钢堆场 - 百兰', 't_warehouse': None, 'item_code': '40CrH-145', 'item_name': '40CrH-145', 'is_finished_item': 0, 'is_scrap_item': 0, 'quality_inspection': None, 'subcontracted_item': None, 'description': '40CrH-145', 'item_group': '原材料', 'image': None, 'qty': 2720.0, 'transfer_qty': 2720.0, 'retain_sample': 0, 'uom': 'Kg', 'stock_uom': 'Kg', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 1.0, 'additional_cost': 0.0, 'valuation_rate': 1.0, 'allow_zero_valuation_rate': 0, 'set_basic_rate_manually': 0, 'basic_amount': 2720.0, 'amount': 2720.0, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': 'SABB-00000580', 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 0.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00189', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail'}, {'name': 'upg736e7tj', 'owner': 'Administrator', 'creation': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified': datetime.datetime(2024, 6, 17, 16, 15, 22), 'modified_by': 'Administrator', 'docstatus': 0, 'idx': 2, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': None, 't_warehouse': '短棒料仓 - 百兰', 'item_code': '30BC_短棒料', 'item_name': '30BC_短棒料', 'is_finished_item': 1, 'is_scrap_item': 0, 'quality_inspection': None, 'subcontracted_item': None, 'description': '30BC_短棒料', 'item_group': '短棒料', 'image': None, 'qty': 24.0, 'transfer_qty': 24.0, 'retain_sample': 0, 'uom': '根', 'stock_uom': '根', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 113.333333333, 'additional_cost': 0.0, 'valuation_rate': 113.333333333, 'allow_zero_valuation_rate': 0, 'set_basic_rate_manually': 0, 'basic_amount': 2720.0, 'amount': 2720.0, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': 'SABB-00000581', 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 0.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00189', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail'}]}
se_doc = {}
def restore_steel_batch_status(kw):
    """ 
    1.查询是否为‘原材料下料出库’，
    2.查询批次号进行status恢复为 已入库 半出库
    """
    # print_green('restore_steel_batch_status run')
    # kw = _dict(kw)
    print(f'{type(kw) = }')
    if not kw:
        kw = se_doc
    # todo 这里需要获取doc，进行校验后设状态
    # 1.是草稿状态 + 剩余==全部/已入库 or 剩余!= 0 + 剩余<= 全部 /半出库
    items = kw.get("items")
    batch_nos = set()
    for item in items:
        # item = _dict(item)
        if item.get("item_group") == '原材料':
            sabb_no = item.get("serial_and_batch_bundle")
            # 获取批次号
            batch_no_items = frappe.db.get_values("Serial and Batch Entry",
                                                { "parent": sabb_no, },
                                                "batch_no")
            for b in batch_no_items:
                batch_nos.add(b[0])
    sb_docs = frappe.get_list("Steel Batch", 
                    fields = '*',
                    filters = {"batch_no": ("in", batch_nos)},
                    )
    for sb in sb_docs:
        if sb.status == '草稿':
            if sb.remaining_weight == sb.weight:
                frappe.db.set_value("Steel Batch", sb.name, "status", "已入库")
            elif sb.remaining_weight < sb.weight:
                frappe.db.set_value("steel Batch", sb.name, "status", "半入库")
    #         sb.save()
    frappe.db.commit()


def process_steel_batch(self):
    """ 原材料下料出库，提交时steel batch的处理：
    1. 检查是否为原材料类物料
    3. 获取SABB 解析初batch_no
    4. 获取steel.doc
    5. 更改状态为已出库，或者半出库，更改在库重量，根数，
    """
    print_blue("stock entry, backend process, steel batch")
    # if self.stock_entry_type != '原钢调拨出库':
    #     return
    item_docs = self.get("items")
    # print_red(f'{len(item_docs)=}')
    try:
        op_index = 0
        for item_doc in item_docs:
            op_length = 0
            op_piece = 0
            op_heat_no = ''
            op_batch_no = ''
            if item_doc.item_group != '原材料':
                continue
            # print_blue(f'{item_doc.as_dict()=}')
            if not item_doc.serial_and_batch_bundle:
                continue
            # 获取批次号组，获取批次号，获取钢材捆批次进行改写
            op_index += 1
            
            sabb_no = item_doc.serial_and_batch_bundle
            sabb_doc = frappe.get_doc("Serial and Batch Bundle", sabb_no)
            # print_cyan(f'{sabb_doc.as_dict()=}')
            # 从SABB中找到 Steel Batch_No/weight, 
            for entry in sabb_doc.entries:
                print_cyan(f'batch_no: {entry.batch_no=}')
                steel_doc = frappe.get_cached_doc("Steel Batch", entry.batch_no)
                op_length = op_length or steel_doc.length 
                op_heat_no = op_heat_no or steel_doc.heat_no
                op_batch_no = op_batch_no or steel_doc.name
                status = ''
                remaining_weight = 0
                remaining_piece = 0
                out_weight = abs(entry.qty)
                if steel_doc.remaining_weight == out_weight:
                    status = '出完'
                    op_piece += steel_doc.remaining_piece
                else:
                    status = '半出库'
                    remaining_weight = steel_doc.remaining_weight - out_weight
                    out_piece = frappe.db.get_value('Temp Doc Value', 
                                                            {
                                                                'doc_type': 'Stock Entry',
                                                                'doc_name': self.get('name'),
                                                            },
                                                            "data_3")
                    # 剩余根数的处理
                    out_piece = cint(out_piece)
                    remaining_piece = steel_doc.remaining_piece - out_piece
                    op_piece += out_piece
                steel_doc.update({
                    "status": status,
                    "remaining_piece": remaining_piece,
                    "remaining_weight": remaining_weight,
                    'link_doc_out': self.name,
                })
                # print_red(f'{steel_doc.as_dict()=}')
    
                steel_doc.save()
                frappe.msgprint(f"原材料状态调整 完成", indicator="green", alert=True)
                

            """ 对每一条出库原材料建立出库Op Flow记录,后边想办法补入入库数据的记录, Op Flow中使用一个标记字段记录第几条原材料 """
            frappe.get_cached_doc({
                "doctype": "Raw Op Flow",
                "record_type": "批次",
                "op_type": "原材料出库",
                "batch_doc": "Steel Batch",
                "batch_no": op_batch_no,
                "link_doc_type": "Stock Entry",
                "link_doc": self.name,
                "index": op_index,
                "item_name": item_doc.item_code,
                "heat_no": op_heat_no,
                "length": op_length,
                "piece": op_piece,
                "weight": item_doc.qty,
            }).save()
            print_red("保存Op Flow：" + cstr(op_index))


            # SABB上重量和三个重量和是否不一样进行报警
            # weight_add = steel_doc.weight + steel_doc.weight2 + steel_doc.weight3
            # if weight_add != item_doc.qty:
            #     frappe.throw(f'{weight_add=} 不同于 {item_doc.qty=}')
            # # print_cyan(f'{vars(steel_doc)=}')

            # frappe.db.commit()
            # print_cyan(f'process end {steel_doc.status=}')
    except Exception as e:
        print("process steel batch error", e)
        frappe.throw(f"调整原材料记录失败：{e}")
    #     traceback.print_exc()


# mock_opts = {'name': 'MAT-STE-2024-00197', 'owner': 'Administrator', 'creation': '2024-06-18 09:16:13', 'modified': '2024-06-18 09:16:22', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 0, 'naming_series': 'MAT-STE-.YYYY.-', 'stock_entry_type': '原材料下料出库', 'outgoing_stock_entry': None, 'purpose': 'Bbl Not Op', 'add_to_transit': 0, 'work_order': None, 'purchase_order': None, 'subcontracting_order': None, 'delivery_note_no': None, 'sales_invoice_no': None, 'pick_list': None, 'purchase_receipt_no': None, 'company': '百兰车轴', 'posting_date': '2024-06-18', 'posting_time': '09:16:22.423613', 'set_posting_time': 0, 'inspection_required': 0, 'apply_putaway_rule': 0, 'from_bom': 0, 'use_multi_level_bom': 1, 'bom_no': None, 'fg_completed_qty': 0.0, 'process_loss_percentage': 0.0, 'process_loss_qty': 0.0, 'from_warehouse': None, 'source_warehouse_address': None, 'source_address_display': None, 'to_warehouse': None, 'target_warehouse_address': None, 'target_address_display': None, 'scan_barcode': None, 'total_outgoing_value': 11238.0, 'total_incoming_value': 11238.0, 'value_difference': 0.0, 'total_additional_costs': 0.0, 'supplier': None, 'supplier_name': None, 'supplier_address': None, 'address_display': None, 'project': None, 'select_print_heading': None, 'letter_head': None, 'is_opening': 'No', 'remarks': None, 'per_transferred': 0.0, 'total_amount': 22476.0, 'job_card': None, 'amended_from': None, 'credit_note': None, 'is_return': 0, 'doctype': 'Stock Entry', 'additional_costs': [], 'items': [{'name': 'hfl6t6n5tb', 'owner': 'Administrator', 'creation': '2024-06-18 09:16:13', 'modified': '2024-06-18 09:16:22', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 1, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': '原钢堆场 - 百兰', 't_warehouse': None, 'item_code': 'C50-130', 'item_name': 'C50-130', 'is_finished_item': 0, 'is_scrap_item': 0, 'quality_inspection': None, 'subcontracted_item': None, 'description': 'C50-130', 'item_group': '原材料', 'image': None, 'qty': 3746.0, 'transfer_qty': 3746.0, 'retain_sample': 0, 'uom': 'Kg', 'stock_uom': 'Kg', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 3.0, 'additional_cost': 0.0, 'valuation_rate': 3.0, 'allow_zero_valuation_rate': 0, 'set_basic_rate_manually': 0, 'basic_amount': 11238.0, 'amount': 11238.0, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': 'SABB-00000608', 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 18724.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00197', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail'}, {'name': 'hfl6lhs2pm', 'owner': 'Administrator', 'creation': '2024-06-18 09:16:13', 'modified': '2024-06-18 09:16:22', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 2, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': None, 't_warehouse': '短棒料仓 - 百兰', 'item_code': '4E_短棒料', 'item_name': '4E_短棒料', 'is_finished_item': 1, 'is_scrap_item': 0, 'quality_inspection': None, 'subcontracted_item': None, 'description': '4E_短棒料', 'item_group': '短棒料', 'image': None, 'qty': 35.0, 'transfer_qty': 35.0, 'retain_sample': 0, 'uom': '根', 'stock_uom': '根', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 321.085714286, 'additional_cost': 0.0, 'valuation_rate': 321.085714286, 'allow_zero_valuation_rate': 0, 'set_basic_rate_manually': 0, 'basic_amount': 11238.0, 'amount': 11238.0, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': 'SABB-00000609', 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 0.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00197', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail'}, {'name': 'hfl6hbqci3', 'owner': 'Administrator', 'creation': '2024-06-18 09:16:13', 'modified': '2024-06-18 09:16:22', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 3, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': None, 't_warehouse': '废料堆场 - 百兰', 'item_code': '原材料头', 'item_name': '原材料头', 'is_finished_item': 0, 'is_scrap_item': 1, 'quality_inspection': None, 'subcontracted_item': None, 'description': '原材料头', 'item_group': '钢材废料', 'image': None, 'qty': 272.0, 'transfer_qty': 272.0, 'retain_sample': 0, 'uom': 'Kg', 'stock_uom': 'Kg', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 0.0, 'additional_cost': 0.0, 'valuation_rate': 0.0, 'allow_zero_valuation_rate': 1, 'set_basic_rate_manually': 0, 'basic_amount': 0.0, 'amount': 0.0, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': None, 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 0.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00197', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail'}]}
mock_opts = {}
def create_raw_bar(self):
    print_blue('进入 创建短棒料')
    # print(f'{self and self.as_dict() = }')
    # todo 这注入调试数据
    # if frappe.flags.wt_test:
    #     print_red('create_raw_bar, wt_test 测试模式')
    # if frappe.cache.set_value('cache_wt_test', 1)
    # if frappe.cache.get_value('cache_wt_test') or not self :
    if not self :
        print_red('create_raw_bar, cache_wt_test 测试模式 😜')
        self = mock_opts
    
    try:
        items = self.get('items')
        last_raw_item = None
        bar_doc = None

        op_index = 0
        for item in items:
            if item.get('item_group') == '原材料':
                last_raw_item = item
                op_index += 1
            elif item.get('item_group') in ['短棒料', '长料头']:
                # print_green_pp(f'{item= }')
                sabb_no = item.get('serial_and_batch_bundle')
                batch_no = frappe.db.get_value('Serial and Batch Entry',
                                {'parent': sabb_no},
                                'batch_no')
                piece = item.get('qty')
                cost = flt(item.get('valuation_rate'), 2)
                temp_doc_length, temp_doc_weight, temp_cbl_length = frappe.db.get_value('Temp Doc Value', 
                                                        {
                                                            'doc_type': 'Stock Entry',
                                                            # 'doc_name': self.get('name'),
                                                            'doc_table_item': last_raw_item.name,
                                                        },
                                                        ["data_1", "data_2", "data_4"]) or (0, 0, 0)
                # op_ratio = temp_doc_length
                if item.get('item_group') == '长料头':
                    temp_doc_length = temp_cbl_length
                # 寻找这个批次，如果存在直接更新数量
                if frappe.db.exists('Short Raw Bar', batch_no):
                    print_red('create_raw_bar, 短棒料已存在')
                    bar_doc = frappe.get_doc('Short Raw Bar', batch_no)
                    # _print_green_pp(bar_doc.as_dict())
                    # 更新数量
                    bar_doc.update({
                        'cost': cost,
                        'in_piece': piece,
                        'remaining_piece': bar_doc.remaining_piece + piece,
                        'accu_piece': bar_doc.accu_piece + piece,
                        'link_doc_in': self.name,
                        'length': temp_doc_length,
                        'weight': temp_doc_weight,
                        'for_date': now(),
                        'status': '未使用',
                    })
                # 如果不存在，创建新的短棒料批次记录
                else :
                    print_blue('create_raw_bar, 短棒料不存在')
                    temp_dict = frappe._dict({
                        'doctype': 'Short Raw Bar',
                        'warehouse': '短棒料仓 - 百兰',
                        'warehouse_area': '',
                        'link_doc_in': self.name,
                        'for_date': now(),
                        'status': '未使用',
                    })
                    temp_dict.raw_bar_name = item.get('item_code')
                    temp_dict.semi_product = item.get('item_code').split('_')[0] #避免sb上没有半成品信息
                    temp_dict.cost = cost
                    temp_dict.in_piece = temp_dict.accu_piece = temp_dict.remaining_piece = piece
                    temp_dict.batch_no = batch_no
                    # 新建短棒料，查询steel batch上的原材料数据
                    raw_sabb_no = last_raw_item.get('serial_and_batch_bundle')
                    raw_batch_no = frappe.db.get_value('Serial and Batch Entry',
                                            {'parent': raw_sabb_no},
                                            'batch_no')
                    sb_doc = frappe.get_cached_doc('Steel Batch', raw_batch_no)
                    temp_dict.heat_no = sb_doc.heat_no
                    temp_dict.raw_name = sb_doc.raw_name
                    temp_dict.diameter = sb_doc.diameter
                    temp_dict.product_name = '产品名称_备用'
                    # 查询Temp Doc Value上存储的临时数据
                    temp_dict.length = temp_doc_length
                    temp_dict.weight = temp_doc_weight
                    # _print_blue_pp(f'{temp_dict=}')
                    bar_doc = frappe.new_doc(**temp_dict)
                    bar_doc.insert(ignore_permissions=True)
                bar_doc.save()
                
                """ 对每一条转化的短棒料，建立一条记录，or 补充到原材料出库记录上 """
                op_doc = frappe.get_cached_doc('Raw Op Flow', 
                            {
                                "link_doc": self.name,
                                "index": op_index,
                            })
                print_red(f'{op_doc.get("bar_name")=}')
                if op_doc.bar_name:
                    op_doc.name = None
                op_doc.update({
                    'bar_batch_no': bar_doc.name,
                    'bar_name': item.item_code,
                    'ratio': temp_doc_length,
                    'bar_piece': item.qty,
                    'status': '半使用',
                })
                op_doc.save()
            else:
                last_raw_item = None
        
        if bar_doc:
            print_red("dbl commit()")
            frappe.msgprint(f"增加: {bar_doc.name} 数量: {bar_doc.in_piece} 成功", indicator="green", alert=True)
            # frappe.db.commit() 
    except ValueError as e:
        print("process create_raw_bar", e)
        frappe.throw(f"新建短棒料批次信息失败：{e}")




def process_srb_change_name(self):
    """ 将短棒料批次信息转化为锻造批次信息 """
    print_red('进入 process_srb_change_name')
    from bbl_app.utils.utils import bbl_dict

    if not bbl_dict.pop('srb_change_name_flag', None):
        return
    # 判断是不是短棒料名称转换
    item_docs = self.get('items')
    # print_red(item_docs)
    # if len(item_docs) != 2:
    #     return
    # for item in item_docs:
    #     if '_短棒料' not in item.get('item_code'):
    #         return
    
    # 进行短棒料文档复制，并修改名称
    try:
        srb_change_name_data = frappe._dict(bbl_dict.pop('srb_tmp1'))
        # 1.通过sabb找到批次srb批次名称
        from_doc = item_docs[0]
        # sabb_doc = frappe.get_cache_doc('Serial and Batch Entry', from_doc.get('serial_and_batch_bundle'))
        # srd_batch_no = sabb_doc.entries[0].batch_no
        srd_batch_no = srb_change_name_data.from_srb_doc_id
        from_qty = srb_change_name_data.target_qty
        to_product_name = srb_change_name_data.target_product_name
        target_item_name = srb_change_name_data.target_item_name
        to_batch_no = srb_change_name_data.to_batch_no
        from_srb_doc = frappe.get_doc('Short Raw Bar', srd_batch_no)
        # 1.1.判断目标doc是否已经存在
        if frappe.db.exists('Short Raw Bar', to_batch_no):
            print_blue("目标短棒料已经存在")
            to_srb_doc = frappe.get_doc('Short Raw Bar', to_batch_no)
            # 3.设置目标短棒料信息
            status2 = "未使用" if to_srb_doc.remaining_piece == 0 else to_srb_doc.status
            to_srb_doc.update({
                'in_piece': from_qty,
                'remaining_piece': to_srb_doc.remaining_piece + from_qty,
                'accu_piece': to_srb_doc.accu_piece + from_qty,
                'link_doc_in': self.name,
                'status': status2,
            }).save(ignore_permissions=True)
        else:
            print_blue("目标短棒料不存在,新建")
            # 2.复制文档
            to_srb_doc = frappe.copy_doc(from_srb_doc, False)
            # 3.设置目标短棒料信息
            to_srb_doc.update({
                # 'name': self.name,
                'batch_no': to_batch_no,
                'raw_bar_name': target_item_name,
                'semi_product': to_product_name,
                'in_piece': from_qty,
                'remaining_piece': from_qty,
                'accu_piece': from_qty,
                # 'used_piece': 0,
                # 'total_used_piece': 0,
                'link_doc_in': self.name,
                # 'voucher_no': None,
                # 'for_date': today(),
                # 'use_date': None,
                'status': '未使用',
            }).insert(ignore_permissions=True)

        from_remaining = from_srb_doc.remaining_piece - from_qty
        if ((not from_remaining) and from_srb_doc.wip_piece == 0) :
            status1 = "用完"
        # voucher_no = from_srb_doc.voucher_no.replace(cstr(from_qty), '0')
        # voucher_no_list = safe_json_loads_from_str(from_srb_doc.get('voucher_no')) or []
        # if voucher_no_list:
        #     voucher_no_list[-1]['voucher_qty'] = 0
        from_srb_doc.update({
            'remaining_piece': from_remaining,
            'voucher_no': _clear_voucher_no_qty(from_srb_doc),
            'status': status1,
        }).save()
        
    except Exception as e:
        frappe.throw(f"短棒料名称转换失败 {e}")
    # finally:
    #     bbl.pop('srb_tmp1')
    # print_yellow(bbl)

def _clear_voucher_no_qty(srb_doc) -> str: 
    """ 清除voucher_no的voucher_qty """
    voucher_no_list = safe_json_loads_from_str(srb_doc.get('voucher_no')) or []
    if voucher_no_list:
        voucher_no_list[-1]['voucher_qty'] = 0
    return frappe.as_json(voucher_no_list)



def process_srb_wip_retrieve(self):
    """ 将短棒料wip数量,转回剩余数量 """
    print_red('进入 process_srb_wip_retrieve')
    item_docs = self.get('items')
    # print_red(item_docs)
    if len(item_docs) != 1:
        return
    for item in item_docs:
        if '_短棒料' not in item.get('item_code'):
            return
    # 1.通过sabb找到批次srb批次名称
    from_doc = item_docs[0]
    sabb_doc = frappe.get_doc('Serial and Batch Bundle', from_doc.get('serial_and_batch_bundle'))
    if len(sabb_doc.entries) != 1:
        frappe.throw('短棒料wip, 转回剩余数量, 转回批次不等于1')
    from_batch_no = sabb_doc.entries[0].batch_no
    from_srb_doc = frappe.get_doc('Short Raw Bar', from_batch_no)
    if (from_srb_doc.wip_piece == 0):
        frappe.show_alert('短棒料wip 数量为 0')
        return
    # print_yellow(from_srb_doc.wip_piece)
    # print_yellow(sabb_doc.entries[0].qty)
    if (from_srb_doc.wip_piece != abs(sabb_doc.entries[0].qty)):
        frappe.throw('短棒料wip != 批次qty')

    from_srb_doc.update({
        'remaining_piece': from_srb_doc.remaining_piece + from_srb_doc.wip_piece,
        'wip_piece': 0,
        'status': '未使用',
        'warehouse': '短棒料仓 - 百兰',
        # 'voucher_no': frappe.as_json(voucher_no_list),
        'voucher_no': _clear_voucher_no_qty(from_srb_doc),
    }).save()
    

# mock_bar_to_forge =  {'name': 'MAT-STE-2024-00332', 'owner': 'Administrator', 
#                         'creation': '2024-07-17 10:22:44', 'modified': '2024-07-17 10:22:44', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 0,
#                         'naming_series': 'MAT-STE-.YYYY.-', 'stock_entry_type': 'Manufacture', 'outgoing_stock_entry': None, 'purpose': 'Manufacture',
#                           'add_to_transit': 0, 'work_order': 'MFG-WO-2024-00048', 'purchase_order': None, 
#                           'subcontracting_order': None, 'delivery_note_no': None, 'sales_invoice_no': None, 'pick_list': None, 'purchase_receipt_no': None, 
#                           'company': '百兰车轴', 'posting_date': '2024-07-17', 'posting_time': '10:22:44.226635', 'set_posting_time': 0, 'inspection_required': 0, 
#                           'apply_putaway_rule': 0, 'from_bom': 1, 'use_multi_level_bom': 1, 'bom_no': 'BOM-2310D_锻坯登记-001', 'fg_completed_qty': 30.0, 
#                           'process_loss_percentage': 0.0, 'process_loss_qty': 0.0, 'from_warehouse': '锻造车间仓库 - 百兰', 'source_warehouse_address': None, 
#                           'source_address_display': None, 'to_warehouse': '锻造车间仓库 - 百兰', 'target_warehouse_address': None, 'target_address_display': None, 
#                           'scan_barcode': None, 'total_outgoing_value': 2822.1, 'total_incoming_value': 2822.1, 'value_difference': 0.0, 'total_additional_costs': 0.0, 
#                           'supplier': None, 'supplier_name': None, 'supplier_address': None, 'address_display': None, 'project': None, 'select_print_heading': None, 
#                           'letter_head': None, 'is_opening': 'No', 'remarks': None, 'per_transferred': 0.0, 'total_amount': 0.0, 'job_card': None, 'amended_from': None, 
#                           'credit_note': None, 'is_return': 0, 'doctype': 'Stock Entry', 'items': [{'name': 'fbcagd583v', 'owner': 'Administrator', 'creation': '2024-07-17 10:22:44',
#                            'modified': '2024-07-17 10:22:44', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 1, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': '锻造车间仓库 - 百兰', 't_warehouse': None, 'item_code': '2310D_短棒料', 'item_name': '2310D_短棒料', 'is_finished_item': 0, 'is_scrap_item': 0, 'quality_inspection': None, 'subcontracted_item': None, 'description': '2310D_短棒料', 'item_group': '短棒料', 'image': None, 'qty': 30.0, 'transfer_qty': 30.0, 'retain_sample': 0, 'uom': '根', 'stock_uom': '根', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 94.07, 'additional_cost': 0.0, 'valuation_rate': 94.07, 'allow_zero_valuation_rate': 0, 'set_basic_rate_manually': 0, 'basic_amount': 2822.1, 'amount': 2822.1, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': 'SABB-00001008', 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 37.0, 'transferred_qty': 0.0, 'bom_no': None, 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00332', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail', '__unsaved': 1}, {'name': 'fbcala58kt', 'owner': 'Administrator', 'creation': '2024-07-17 10:22:44', 'modified': '2024-07-17 10:22:44', 'modified_by': 'Administrator', 'docstatus': 1, 'idx': 2, 'barcode': None, 'has_item_scanned': 0, 's_warehouse': None, 't_warehouse': '锻造车间仓库 - 百兰', 'item_code': '2310D_锻坯登记', 'item_name': '2310D_锻坯登记', 'is_finished_item': 1, 'is_scrap_item': 0, 'quality_inspection': None, 'subcontracted_item': None, 'description': '2310D_锻坯登记', 'item_group': '过程半成品', 'image': None, 'qty': 30.0, 'transfer_qty': 30.0, 'retain_sample': 0, 'uom': '根', 'stock_uom': '根', 'conversion_factor': 1.0, 'sample_quantity': 0, 'basic_rate': 94.07, 'additional_cost': 0.0, 'valuation_rate': 94.07, 'allow_zero_valuation_rate': 0, 'set_basic_rate_manually': 0, 'basic_amount': 2822.1, 'amount': 2822.1, 'use_serial_batch_fields': 0, 'serial_and_batch_bundle': None, 'serial_no': None, 'batch_no': None, 'expense_account': '库存调整 - 百兰', 'cost_center': '主 - 百兰', 'project': None, 'actual_qty': 264.0, 'transferred_qty': 0.0, 'bom_no': 'BOM-2310D_锻坯登记-001', 'allow_alternative_item': 0, 'material_request': None, 'material_request_item': None, 'original_item': None, 'against_stock_entry': None, 'ste_detail': None, 'po_detail': None, 'sco_rm_detail': None, 'putaway_rule': None, 'reference_purchase_receipt': None, 'job_card_item': None, 'parent': 'MAT-STE-2024-00332', 'parentfield': 'items', 'parenttype': 'Stock Entry', 'doctype': 'Stock Entry Detail', '__unsaved': 1}], 'additional_costs': [], '__unsaved': 1}

mock_bar_to_forge =  {}

def process_bar_to_forge(self):
    """ 将短棒料批次信息转化为锻造批次信息 """
    print_blue('进入 bar_to_forge')
    # print(f'{self and self.as_dict() = }')
    # todo 这注入调试数据
    if not self :
        frappe.flags.wt_t1 = True
        print_red('process_bar_to_forge, 测试模式 😜')
        self = mock_bar_to_forge
    # 根据工单入库信息，转换：短棒料 to 锻坯登记
    # 相关管理列表中，减掉短棒料数量
    # 新建 锻坯登记信息，存入相应的数量(Semi Product Manage )
    item_docs = self.get('items')
    voucher_no = self.get('work_order')
    bar_item = None
    for item in item_docs:
        if '短棒料' in item.get('item_code'):
            print_green('处理短棒料')
            # adjust_short_bar_status()
            bar_item = item
        elif '锻坯登记' in item.get('item_code'):
            print_green('处理锻坯登记')
            create_forge_blank(bar_item, item, voucher_no)

def adjust_short_bar_status(sabb_no, voucher_no):
    sabb_doc = frappe.get_cached_doc('Serial and Batch Bundle', sabb_no)
    batchs = sabb_doc.entries
    for batch in batchs:
        srb_doc = frappe.get_doc("Short Raw Bar", batch.batch_no)
        vn_obj = safe_json_loads_from_str(srb_doc.get('voucher_no'))
        print_red(f'{vn_obj = }')
        for vn in vn_obj:
            if isinstance(vn, dict):
                print_red(f'{voucher_no = }')
                if vn.get('voucher_no') == voucher_no:
                    vn['voucher_qty'] = vn.get('voucher_qty', 0) - abs(batch.qty)
                    print(f'{vn = }')
                    break

        used_qty = abs(batch.qty)
        wip_piece = srb_doc.wip_piece - used_qty
        srb_doc.status = "部分锻造"
        if wip_piece == 0:
            if srb_doc.remaining_piece == 0:
                srb_doc.status = "用完"
        srb_doc.update({
            "wip_piece": wip_piece,
            "use_date": today(),
            "used_piece": used_qty,
            "total_used_piece": srb_doc.total_used_piece + used_qty,
            "voucher_no": frappe.as_json(vn_obj)
        }).save()

def create_forge_blank(bar_item, forge_item, voucher_no):
    print_blue("新建锻坯登记信息")
    if frappe.flags.wt_t1:
        bar_item = frappe._dict(bar_item)
        forge_item = frappe._dict(forge_item)

    sabb_no = bar_item.get('serial_and_batch_bundle') 
    adjust_short_bar_status(sabb_no, voucher_no)
    sabb_doc = frappe.get_cached_doc('Serial and Batch Bundle', sabb_no)
    bar_batch_no = sabb_doc.entries[0].batch_no
    # raw_batch_no = frappe.db.get_value('Serial and Batch Entry',
    #                     {'parent': raw_sabb_no},
    #                     'batch_no')

    print_red(f'{len(sabb_doc.entries) = }')
    print_red(bar_batch_no)
    bar_doc = frappe.get_doc('Short Raw Bar', bar_batch_no)
    # _print_blue_pp(bar_doc)

    # forge_bathch_no = 'DP-' + today().replace('-', '') + '-' + forge_item.item_code.replace('_锻坯登记', '')[-4:] + '-' + frappe.utils.random_string(2)
    # blank_batch_no = _make_blank_batch_no(bar_batch_no)
    semi_product_name = forge_item.item_code.replace('_锻坯登记', '')
    blank_batch_no = make_simi_product_batch_no(semi_product_name, "DP/DJ")

    # 这里改为每次都新建一个锻坯登记批次信息
    if not frappe.db.exists('Semi Product Manage', blank_batch_no):
        forge_doc = frappe.new_doc(**{
            'doctype': 'Semi Product Manage',
            'batch_no': blank_batch_no,
            'semi_product_name': forge_item.item_code,
            # 'forge_batch_no': 'no-' + forge_bathch_no,
            'raw_name': bar_doc.raw_name,
            'raw_heat_no': bar_doc.heat_no,
            'cost': forge_item.basic_rate,
            'last_in_piece': forge_item.qty,
            'remaining_piece': forge_item.qty,
            'total_piece': forge_item.qty,
            'warehouse': forge_item.t_warehouse,
            'status': '未使用',
            'semi_product': forge_item.item_code.replace('_锻坯登记', ''),
            'product_form': '锻坯登记',
            'link_doc': forge_item.parent,
            "short_bar_doc": bar_doc.name,
            'op_times': 1,
            'op_list': '锻坯登记',
            'yield_list': '下料',
            'operation': '下料',

            }).insert(ignore_links=True)
    else:
        # todo 以下未使用，可能需要删除
        forge_doc = frappe.get_doc('Semi Product Manage', blank_batch_no)
        forge_doc.update({
            'last_in_piece': forge_item.qty,
            'remaining_piece': forge_doc.remaining_piece + forge_item.qty,
            'total_piece': forge_doc.total_piece + forge_item.qty,
            'cost': forge_item.basic_rate,
            'link_doc': forge_item.parent,
            'status': '未使用',
        }).save()

    # create_op_flow
    frappe.get_doc({
        'doctype': 'Semi Op Flow',
        "record_type": "产品转换",
        "op_type": "锻坯登记",
        "batch_doc": "Short Raw Bar",
        "batch_no": bar_batch_no,
        "item_name": bar_item.item_code,

        "piece": forge_item.qty,
        "weight": bar_doc.weight,
        "link_doc_type": "Stock Entry",
        "link_doc": forge_item.parent,

        "tar_batch_no": forge_doc.batch_no,
        "tar_name": forge_item.item_code,
        "tar_piece": forge_item.qty,
        "product_class": "锻坯登记",
        "note": "短棒料进行锻造生产成锻坯登记的记录",
    }).insert()

    if frappe.flags.wt_t1:
        frappe.db.commit()
    print_green('锻坯登记信息已新建')
    # todo 建操作记录

# blank 毛坯
# def _make_blank_batch_no(bar_batch_no):
#     # todo 锻坯登记批次号内是否需要标识原材料炉号
#     # forge_bathch_no = 'DP-' + item_code.replace('_锻坯登记', '')[-6:] + '-' + today().replace('-', '')
#     forge_bathch_no = bar_batch_no.replace('DBL', 'DP')
#     return forge_bathch_no



def t1():
    item_code = '5004_锻坯登记'
    forge_bathch_no = 'DP-' + today().replace('-', '') + '-' + item_code.replace('_锻坯登记', '')[-6:] + '-' + frappe.utils.random_string(2)
    print(forge_bathch_no)
    pass

""" DEBUG
import bbl_app.overrides.over_stock_entry as se
se.process_bar_to_forge(None)
se._semi_id_exist('DP-20240710-AF60-3Z')
"""