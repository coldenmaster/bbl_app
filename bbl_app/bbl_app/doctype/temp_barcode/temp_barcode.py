# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

from bbl_app.common.cp_qrcode import code_is_customer
from bbl_app.common.raw_qrcode import GangbangParse
import frappe
from frappe.model.document import Document

from bbl_api.utils import print_red


class TempBarcode(Document):
	pass

# http://dev2.localhost:8000/api/method/bbl_app.bbl_app.doctype.temp_barcode.temp_barcode.sendup_barcode?scan_barcode=123
@frappe.whitelist(allow_guest=True)
def sendup_barcode(**kwargs):
    ''' 
        根据上传的二维码，解析条码类型，查询数据库，如果有此条码信息，返回doc到前端进行Frm显示 
     '''
    print_red(kwargs)

    # 保存上传从二维码数据
    kwargs['doctype'] = 'Temp Barcode'
    new_doc = frappe.get_doc(kwargs)
    new_doc.insert()
    frappe.db.commit()

    # 根据上传的二维码，解析条码类型，查询数据库，如果有此条码信息，返回doc到前端进行Frm显示 
    scan_barcode = kwargs.get('scan_barcode')
    doc = None
    if (scan_barcode):
        doc = parse_qrcode(scan_barcode)
        # return doc.as_dict()

    return doc

def parse_qrcode(qrcode):
    qrcode_upper = qrcode.upper()
    qrcode_no_seq = qrcode_upper.replace('*', '').replace('-', '')

    if(qrcode_no_seq.startswith('BBLBM') and frappe.db.exists('Product Package Info', qrcode)):
        return frappe.get_doc('Product Package Info', qrcode)
    
    if(qrcode_no_seq.startswith('BBL') and frappe.db.exists('Finished Product Manage', qrcode)):
        return frappe.get_doc('Finished Product Manage', qrcode)
    # todo 任意条码，尝试查询百兰产品信息，（测试使用，以后删除）
    if(frappe.db.exists('Finished Product Manage', qrcode)):
        return frappe.get_doc('Finished Product Manage', qrcode)

    if (code_is_customer(qrcode)): 
        docs = frappe.get_all('Finished Product Manage', 
                            #    filters=[['customer_barcode','=', qrcode],] # 都可以
                               filters={'customer_barcode': qrcode}
                            )
        if(len(docs) > 0):
            return frappe.get_doc('Finished Product Manage', docs[0].name)
        else:
            return '客户条码信息不存在'
    
    # 原材料查询
    # 改为解析出包码，再查询包码对应的原材料信息
    raw_bundle_name = GangbangParse().parse_bundle_no(qrcode)
    print(raw_bundle_name)
    if (raw_bundle_name):
        if (frappe.db.exists('Steel Batch', raw_bundle_name)):
            return frappe.get_doc('Steel Batch', raw_bundle_name)
        else:
            return '原材料信息不存在'

    # 半成品流转卡查询
         
    return '数据库中未找到此条码信息'




''' 
import bbl_app.bbl_app.doctype.temp_barcode.temp_barcode as tb
tb.parse_qrcode('')
扫码打包信息
tb.parse_qrcode('bbl*B3m*yangben*223322')
本厂产品条码信息
tb.parse_qrcode('BBL-CP-PAD-20241010-036')
客户条码信息查询
tb.parse_qrcode('652253611802130005')
tb.parse_qrcode('X1250*3001011-NF05H***QZ0022409240115*2**7GMAG3PEb')
tb.parse_qrcode('X1250*3001011-NF05H***QZ0022409240115*2**7GMAG3PEX1250*3001011-NF05H***QZ0022409240115*2**7GMAG3PE')
原材料信息查询
tb.parse_qrcode('湖南华菱湘潭钢铁有限公司（XISC） 产品名称：优质碳素结构钢 牌号:50 技术标准:XYXB2014-033 材料号:B22421204/0221 规格(Φ):150mm 定尺长度:7560mm 支数:3，重量:9172Kg 炉号:24701925 许可证: 合同号: 制造厂:棒材厂 生产日期:2024-02-21')

客户打包码查询
tb.parse_qrcode('公司:济源钢铁 钢种:BL42CrMoA-1 规格:Φ150mm*7044mm 标准:Q/JG.03.094-2020 A/0 炉号:V12402467 捆号:D12402467019 支数:3 重量:2962kg 生产日期:20240323')


frappe.get_all('Finished Product Manage', 
                               filters=[['customer_barcode','=', '652253611802130005'],]
                            )

 '''