import math
import re

# from bbl_api.utils_pure import print_blue, print_yellow


density = 7.9

def calc_weight(diameter, long_size, bundle_num, density):
    area = math.pi * (diameter / 2) ** 2
    weight = long_size * area * density / 1000 / 1000
    return weight * bundle_num

def calc_long(diameter, weight, bundle_num, density):
    area = math.pi * (diameter / 2) ** 2
    long_size = weight * 1000 * 1000 / density / area
    return long_size / bundle_num

def calc_diameter(long_size, weight, bundle_num, density):
    area = weight / long_size / bundle_num / density * 1000 * 1000
    diameter = math.sqrt(area / math.pi) * 2
    return round(diameter, 3)

def calc_kg_per_mm(weight, long_size, num):
    return weight / long_size / num

def calc_mm_to_weight(long_size, num, kg_pmm):
    return long_size * num * kg_pmm

def calc_weight_percent(weight, long_size, num, diameter, density):
    calc_weight = calc_weight(diameter, long_size, num, density)
    percent = (weight - calc_weight) / calc_weight * 100
    return round(percent, 2)

def raw_weight_to_length(weight, dia, density=7.9):
    weight = int(weight)
    dia = int(dia)
    volume = weight * 1000 * 1000 / density
    length = volume / (dia * dia * math.pi / 4)
    return int(length)

def filt_qrcode(qrcode_str):
    qrcode_str = qrcode_str.strip()
    qrcode_str = re.sub(r"<br />", " ", qrcode_str)
    qrcode_str = re.sub(r"\n", " ", qrcode_str)
    qrcode_str = re.sub(r"smq750_", "", qrcode_str)
    qrcode_str = re.sub(r"\"", "", qrcode_str)
    qrcode_str = re.sub(r"\'", "", qrcode_str)
    # print_yellow(qrcode_str)
    return qrcode_str
    


class GangbangParse:
    def __init__(self):
        self.errMsg = False
        self.uploadBean = None
        self.xianggang = ""
        self.jigang = ""
        self.yegang = ""
        self.xinxing = ""
        self.dongte = ""
        self.changqiang = ""


    def get_companys(self):
        return ["", self.xianggang, self.jigang, self.yegang, self.xinxing]

    def parse(self, qrcode_str):
        qrcode_str = filt_qrcode(qrcode_str)

        self.uploadBean = {}
        if (self.yegang_parse(qrcode_str) or
            self.jigang_parse(qrcode_str) or
            self.xianggang_parse(qrcode_str) or
            self.xinxing_parse(qrcode_str) or
            self.dongte_parse(qrcode_str) or
            self.changqiang_parse(qrcode_str)):
            return self.uploadBean
        return False

    def parse_bundle_no(self, qrcode_str):
        if self.parse(qrcode_str):
            return self.uploadBean.get("bundleNo", False)
        return False

    @staticmethod
    def is_raw_qrcode(qrcode_str):
        cls = GangbangParse
        return ( cls.is_yegang(qrcode_str) 
                or cls.is_jigang(qrcode_str) 
                or cls.is_xianggang(qrcode_str) 
                or cls.is_xinxing(qrcode_str) 
                or cls.is_dongte(qrcode_str) 
                or cls.is_changqiang(qrcode_str)
        )
    

    @staticmethod
    def is_yegang(qrcode_str):
        company = "大冶特殊钢有限公司"
        if qrcode_str.endswith(company):
            return True
        return False

    def yegang_parse(self, qrcode_str):
        # company = "大冶特殊钢有限公司"

        if not GangbangParse.is_yegang(qrcode_str):
            return False

        match_keys = [
            ["合同号", "contractNo"],
            ["牌号", "steelGrade"],
            ["规格", "diaSize"],
            ["标准", "standardNo"],
            ["卡片号", "bundleNo"],
            ["炉号", "heatNo"],
            ["捆号", "bundleIdx"],
            ["支数", "bundleNum"],
            ["重量", "weight"],
            ["日期", "productDate"],
        ]

        kv_string_array = qrcode_str.split(",")
        for kv_string in kv_string_array:
            kv = kv_string.split(":")
            for match_key in match_keys:
                if kv[0] == match_key[0]:
                    self.uploadBean[match_key[1]] = kv[1]
                    continue

        self.uploadBean["bundleNo"] = f"{self.uploadBean['bundleNo']}/{self.uploadBean['bundleIdx']}/{self.uploadBean['bundleNum']}"

        dia_length = self.uploadBean["diaSize"].split("×")
        self.uploadBean["diaSize"] = dia_length[0]
        self.uploadBean["length"] = dia_length[1] if len(dia_length) > 1 else ''

        if len(self.uploadBean["steelGrade"]) < 3:
            self.uploadBean["steelGrade"] = "C" + self.uploadBean["steelGrade"]
        self.uploadBean["diaSize"] = self.uploadBean["diaSize"][1:]
        self.uploadBean["company"] = "大冶特钢"
        return self.uploadBean

    @staticmethod
    def is_jigang(qrcode_str):
        if qrcode_str.startswith("公司:济源钢铁"):
            return True
        if qrcode_str.startswith("D"):
            return True
        return False

    def jigang_parse(self, qrcode_str):
        qrcode_str = re.sub(r"-.-", "-", qrcode_str)
        qrcode_str = qrcode_str.replace("BL", "")

        if not GangbangParse.is_jigang(qrcode_str):
            return False
        
        if qrcode_str.startswith("D"):
            strs = qrcode_str.split("-")
            if len(strs[0]) != 12:
                return False

            self.uploadBean["company"] = "济源钢铁"
            self.uploadBean["bundleNo"] = strs[0]
            self.uploadBean["heatNo"] = strs[0].replace("D", "V")[:-3]
            if len(strs[1]) < 3:
                strs[1] = "C" + strs[1]
            self.uploadBean["steelGrade"] = strs[1]
            self.uploadBean["diaSize"] = strs[2][1:]
            self.uploadBean["weight"] = strs[3]
            self.uploadBean["productDate"] = f"{strs[4][:4]}-{strs[4][4:6]}-{strs[4][6:]}"

            return self.uploadBean

        if qrcode_str.startswith("公司:济源钢铁"):
            match_keys = [
                ["公司", "company"],
                ["钢种", "steelGrade"],
                ["规格", "diaSize"],
                ["标准", "standardNo"],
                ["合同号", "contractNo"],
                ["炉号", "heatNo"],
                ["捆号", "bundleNo"],
                ["支数", "bundleNum"],
                ["重量", "weight"],
                ["生产日期", "productDate"],
            ]

            kv_string_array = qrcode_str.split(" ")
            for kv_string in kv_string_array:
                kv = kv_string.split(":")
                for match_key in match_keys:
                    if kv[0] == match_key[0]:
                        self.uploadBean[match_key[1]] = kv[1]
                        continue

            if self.uploadBean.get("diaSize"):
                dia_length = self.uploadBean["diaSize"].split("*")
                self.uploadBean["diaSize"] = dia_length[0]
                self.uploadBean["length"] = dia_length[1]

            self.uploadBean["steelGrade"] = self.uploadBean["steelGrade"].split("-")[0]
            if len(self.uploadBean["steelGrade"]) < 3:
                self.uploadBean["steelGrade"] = "C" + self.uploadBean["steelGrade"]
            self.uploadBean["diaSize"] = self.uploadBean["diaSize"][1:]
            return self.uploadBean

        return False


    @staticmethod
    def is_xianggang(qrcode_str):
        if qrcode_str.startswith("湖南华菱"):
            return True
        return False
    
    def xianggang_parse(self, qrcode_str):
        if not GangbangParse.is_xianggang(qrcode_str):
            return False

        qrcode_str = re.sub(r"\(L\)", "", qrcode_str)
        qrcode_str = re.sub(r"，", " ", qrcode_str)
        qrcode_str = re.sub(r"：", ":", qrcode_str)

        match_map = {
            "湖南华菱": "company",
            "产品名称": "productName",
            "牌号": "steelGrade",
            "技术标准": "standardNo",
            "材料号": "bundleNo",
            "规格(Φ)": "diaSize",
            "定尺长度": "length",
            "支数": "bundleNum",
            "重量": "weight",
            "炉号": "heatNo",
            "许可证": "prodLisence",
            "合同号": "contractNo",
            "制造厂": "factory",
            "生产日期": "productDate"
        }

        # 搜索字符串，找到后在字符串前面插入一个空格
        for match_key in match_map.keys():
            qrcode_str = qrcode_str.replace(match_key , " " + match_key)
        # print_yellow(qrcode_str)

        self.uploadBean["company"] = "华菱湘钢"
        str_li = qrcode_str.split(" ")
        for kv in str_li:
            if ":" in kv:
                key, value = kv.split(":")
                self.uploadBean[match_map[key]] = value

        self.uploadBean["bundleIdx"] = self.uploadBean["bundleNo"].split("/")[1]
        if self.uploadBean["steelGrade"].strip().isdigit():
            self.uploadBean["steelGrade"] = self.uploadBean["steelGrade"].strip() + "H"
        return self.uploadBean


    @staticmethod
    def is_xinxing(qrcode_str):
        identifier = "http://abc.whxxzg"
        if qrcode_str.startswith(identifier):
            return True
        return False
    
    def xinxing_parse(self, qrcode_str):
        if not GangbangParse.is_xinxing(qrcode_str):
            return False
        
        company = '新兴铸构'
        # qrcode_str = re.sub(r'http.*\?', '', qrcode_str)
        qrcode_str = qrcode_str.replace('?', '&')

        match_keys = [
            ['s', 'steelGrade'],
            ['g', 'diaSize'],
            ['p', 'bundleNo'],
            ['k', 'bundleIdx'],
            ['w', 'weight'],
            ['a', 'company'],
            ['sp', 'sp'],
        ]

        kv_string_array = qrcode_str.split('&')
        for kv_string in kv_string_array:
            if '=' in kv_string:
                kv = kv_string.split('=')
                for match_key in match_keys:
                    if kv[0] == match_key[0]:
                        self.uploadBean[match_key[1]] = kv[1]
                        break

        self.uploadBean["bundleNo"] = f"{self.uploadBean.get('bundleNo')}/{self.uploadBean.get('bundleIdx')}"

        if self.uploadBean.get("diaSize"):
            dia_size = self.uploadBean["diaSize"].replace("Φ", "").replace("m", "")
            dia_length = dia_size.split("*")
            self.uploadBean["diaSize"] = dia_length[0]
            self.uploadBean["length"] = int(dia_length[1]) * 1000

        if len(self.uploadBean["steelGrade"]) < 3:
            self.uploadBean["steelGrade"] = "C" + self.uploadBean["steelGrade"]
        self.uploadBean["diaSize"] = self.uploadBean["diaSize"][1:]
        self.uploadBean["company"] = company
        return self.uploadBean


    @staticmethod
    def is_dongte(qrcode_str):
        identifier = "代码:0104"
        if qrcode_str.startswith(identifier):
            return True
        return False
    
    def dongte_parse(self, qrcode_str):
        company = "东方特钢"
        if not GangbangParse.is_dongte(qrcode_str):
            return False

        match_keys = [
            ["名称", "steelGrade"],
            ["规格", "diaSizeLength"],
            ["重量", "weight"],
            ["炉号", "heatNo"],
            ["轧制批号", "bundleNo"],
            ["二维码", "qrcode"],
            ["代码", "companyCode"],
        ]

        kv_string_array = qrcode_str.split(";")
        # print_blue(kv_string_array)
        for kv_string in kv_string_array:
            kv = kv_string.split(":")
            for match_key in match_keys:
                if kv[0] == match_key[0]:
                    self.uploadBean[match_key[1]] = kv[1]
                    break

        self.uploadBean["bundleNo"] = f"{self.uploadBean['bundleNo']}/{self.uploadBean['qrcode'][-2:]}"
        dia_length = self.uploadBean["diaSizeLength"].split("*")
        self.uploadBean["diaSize"] = dia_length[0][1:]
        self.uploadBean["length"] = dia_length[1] or ""
        self.uploadBean["steelGrade"] = re.sub(r"圆钢", "", self.uploadBean["steelGrade"]).strip()
        self.uploadBean["company"] = company
        # print_yellow(self.uploadBean)
        return self.uploadBean


    @staticmethod
    def is_changqiang(qrcode_str):
        identifier = "13,"
        if qrcode_str.startswith(identifier):
            return True
        return False
    
    def changqiang_parse(self, qrcode_str):
        company = "长强钢铁"
        if not GangbangParse.is_changqiang(qrcode_str):
            return False

        data_ls = qrcode_str.split(",")
        self.uploadBean["qrcode"] = qrcode_str
        self.uploadBean["productName"] = "热轧圆钢"
        self.uploadBean["diaSize"] = data_ls[5][1:]
        self.uploadBean["steelGrade"] = data_ls[4]
        if len(self.uploadBean["steelGrade"]) < 3:
            self.uploadBean["steelGrade"] = "C" + self.uploadBean["steelGrade"]
        self.uploadBean["heatNo"] = data_ls[6]
        self.uploadBean["bundleNo"] = f"{data_ls[1]}/{data_ls[2]}"
        self.uploadBean["bundleIdx"] = data_ls[2]
        self.uploadBean["bundleNum"] = data_ls[8]
        self.uploadBean["weight"] = data_ls[7]
        self.uploadBean["contractNo"] = data_ls[3]
        self.uploadBean["company"] = company
        self.uploadBean["productdate"] = data_ls[1][:8]
        # 标签上没有，自动计算长度， 相应的减少一点长度，暂定减少20mm
        t_length = raw_weight_to_length(self.uploadBean["weight"], self.uploadBean["diaSize"])
        self.uploadBean["length"] = t_length / int(self.uploadBean["bundleNum"]) - 20
        return self.uploadBean

# Example usage:
# parser = GangbangParse()
# result = parser.parse("your_qrcode_string")
# print(result)

if __name__ == "__main__":
    # 示例：计算重量
    # _xianggang = "湖南华菱湘潭钢铁有限公司（XISC）产品名称：优质碳素结构钢牌号:C50技术标准:XYXB2013-018材料号:B22110560A002/002规格(Φ):110mm定尺长度:6460mm重量:2438Kg炉号:20712178许可证:合同号:制造厂:棒材厂生产日期:2021-01-20"
    # _xianggang2 = "湖南华菱湘潭钢铁有限公司（XISC） 产品名称：优质碳素结构钢 牌号:50 技术标准:XYXB2014-033 材料号:B22421204/0221 规格(Φ):150mm 定尺长度:7560mm 支数:3，重量:9172Kg 炉号:24701925 许可证: 合同号: 制造厂:棒材厂 生产日期:2024-02-21"
    # _jigang2 = "D22103908022-BL42CrMoA-1-Φ150mm-2790kg-20210509"
    _jigang = "D22101561026-BL42CrMoA-2-Φ130mm-3460kg-20210302"
    # _yegang = "合同号:G142102001(1708293),牌号:50,规格:Φ150mm,标准:XYGN1415-2015,卡片号:H721073140,炉号:1015098Z,捆号:2,支数:3,重量:2888kg,日期:2021-05-12,公司:大冶特殊钢有限公司"
    # _xingxing = "http://abc.whxxzg.com:8327/?p=24604336&k=32&w=3381&sp=2460433301&g=Φ95mm*6m&s=40Cr&a=xxzg"
    # _dongte = "代码:0104030071;名称:40Cr圆钢;规格:Φ95*6000;重量:3012;炉号:4205737;轧制批号:B4041004;二维码:JO40IX7"
    # _changqiang = "13,24-09-0547,10,105894,40Cr,Φ90,24-111801,4558,10"
    _sb = "213,24-09-0547,10,105894,40Cr,Φ90,24-111801,4558,10"
    # weight = GangbangCalc.calc_weight(150, 6460, 2, 7.9)
    # print(f"Weight: {weight} kg")

    # # 示例：解析二维码
    parser = GangbangParse()
    # result = parser.parse("<br /> smq750_合同号:G142102001(1708293),牌号:50,规格:Φ150mm,标准:XYGN1415-2015,卡片号:H721073140,炉号:1015098Z,捆号:2,支数:3,重量:2888kg,日期:2021-05-12,公司:大冶特殊钢有限公司")
    # print(result)
    # result = parser.parse(_xianggang)
    # print(result)
    # result = parser.parse(_xianggang2)
    # print(result)
    # result = parser.parse(_jigang)
    # print(result)
    # result = parser.parse(_jigang2)
    # print(result)
    # result = parser.parse(_yegang)
    # print(result)    
    # result = parser.parse(_xingxing)
    # print(result)    
    # result = parser.parse_bundle_no(_xingxing)
    # print(result)    
    # result = parser.parse(_dongte)
    # print(result)    
    # result = parser.parse_bundle_no(_dongte)
    # print(result)    
    # result = parser.parse(_changqiang)
    # print(result)    
    # result = parser.parse_bundle_no(_changqiang)
    # print(result)    
    result = GangbangParse.is_raw_qrcode(_sb)
    print(result)    
    result = GangbangParse.is_raw_qrcode(_jigang)
    print(result)    



    # result = parser.parse_bundle_no(_yegang)
    # print(result)

    # result = parser.parse_bundle_no(_xianggang)
    # print(result)

