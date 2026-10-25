"""그림 속 서비스 칩(rect.svc + text.tw)에 AWS 공식 아키텍처 아이콘(aws-icons 패키지)을 붙인다.
- 아이콘은 한 번만 <symbol> 로 페이지에 넣고, 칩에서는 <use href="#awsi-..."> 로 씀
- 칩 안에 자리가 모자라면 아이콘을 넣지 않음 (글자가 넘치지 않게)
"""
import re, pathlib, urllib.request

H = pathlib.Path(__file__).resolve().parent
CACHE = H.parent / 'cloud' / 'awsicons'
CDN = 'https://cdn.jsdelivr.net/npm/aws-icons@3.2.0/icons/'

# (라벨 정규식, 아이콘 경로) — 위에서부터 먼저 맞는 것
MAP = [
    (r'Auto Scaling', 'architecture-service/AmazonEC2AutoScaling'),
    (r'RDS Proxy', 'resource/AmazonRDSProxyInstance'),
    (r'Aurora', 'architecture-service/AmazonAurora'),
    (r'DynamoDB|테이블 복제본', 'architecture-service/AmazonDynamoDB'),
    (r'DocumentDB', 'architecture-service/AmazonDocumentDB'),
    (r'Neptune', 'architecture-service/AmazonNeptune'),
    (r'Redshift', 'architecture-service/AmazonRedshift'),
    (r'Timestream', 'architecture-service/AmazonTimestream'),
    (r'QLDB', 'architecture-service/AmazonQuantumLedgerDatabase'),
    (r'ElastiCache', 'architecture-service/AmazonElastiCache'),
    (r'DMS', 'architecture-service/AWSDatabaseMigrationService'),
    (r'RDS|프라이머리|스탠바이|복제본|DB 인스턴스|기본 DB|대기 DB|^DB$|DB 스냅샷|Oracle|MySQL', 'architecture-service/AmazonRDS'),
    (r'Lambda', 'architecture-service/AWSLambda'),
    (r'ECS|EKS', 'architecture-service/AmazonElasticContainerService'),
    (r'Lightsail', 'architecture-service/AmazonLightsail'),
    (r'Beanstalk', 'architecture-service/AWSElasticBeanstalk'),
    (r'CloudFront', 'architecture-service/AmazonCloudFront'),
    (r'엣지 로케이션|엣지 캐시', 'resource/AmazonCloudFrontEdgeLocation'),
    (r'ALB|ELB', 'architecture-service/ElasticLoadBalancing'),
    (r'GWLB', 'resource/ElasticLoadBalancingGatewayLoadBalancer'),
    (r'송신 전용 IGW|IGW', 'resource/AmazonVPCInternetGateway'),
    (r'NAT', 'resource/AmazonVPCNATGateway'),
    (r'엔드포인트', 'resource/AmazonVPCEndpoints'),
    (r'ENI', 'resource/AmazonVPCElasticNetworkInterface'),
    (r'Network Firewall', 'architecture-service/AWSNetworkFirewall'),
    (r'CloudWatch', 'architecture-service/AmazonCloudWatch'),
    (r'CloudFormation', 'architecture-service/AWSCloudFormation'),
    (r'IAM Identity Center', 'architecture-service/AWSIAMIdentityCenter'),
    (r'STS', 'resource/AWSIdentityAccessManagementAWSSTS'),
    (r'IAM 정책|^정책$', 'resource/AWSIdentityAccessManagementPermissions'),
    (r'역할', 'resource/AWSIdentityAccessManagementRole'),
    (r'IAM', 'architecture-service/AWSIdentityandAccessManagement'),
    (r'KMS|관리 키', 'architecture-service/AWSKeyManagementService'),
    (r'Secrets Manager', 'architecture-service/AWSSecretsManager'),
    (r'SQS', 'architecture-service/AmazonSimpleQueueService'),
    (r'SNS', 'architecture-service/AmazonSimpleNotificationService'),
    (r'Athena', 'architecture-service/AmazonAthena'),
    (r'Transfer Family', 'architecture-service/AWSTransferFamily'),
    (r'^Compute$|Compute Optimizer', 'architecture-service/AWSComputeOptimizer'),
    (r'FSx', 'architecture-service/AmazonFSxforWFS'),
    (r'EFS', 'architecture-service/AmazonEFS'),
    (r'EBS|gp2|gp3|io1|io2|st1|sc1|스냅샷', 'architecture-service/AmazonElasticBlockStore'),
    (r'S3|버킷|오리진', 'architecture-service/AmazonSimpleStorageService'),
    (r'EC2|배스천|웹 서버|웹 \d|앱 [AB]$|^앱$|인스턴스$|주문 앱|소스 EC2|대상 :22', 'architecture-service/AmazonEC2'),
    (r'인터넷', 'resource/Internet'),
    (r'데이터 센터|온프레미스', 'architecture-group/Corporatedatacenter'),
    (r'클라이언트|브라우저', 'resource/Client'),
    (r'사용자|고객|관리자|감사인|직원|협력사|소유자|요청자|^(Alice|Bob|Carol|Dan|Kim)$|Bob$|^나 ', 'resource/User'),
]
MAP = [(re.compile(p), ic) for p, ic in MAP]
# 홈·개념 화면 모듈 아이콘
MODULE_ICONS = {2: 'architecture-service/AWSWellArchitectedTool', 3: 'architecture-service/AWSIdentityandAccessManagement', 4: 'architecture-service/AmazonSimpleStorageService',
                5: 'architecture-service/AmazonEC2', 6: 'architecture-service/AmazonRDS', 7: 'architecture-service/AmazonVirtualPrivateCloud'}

def sym_id(path): return 'awsi-' + path.split('/')[-1]

def fetch(path):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / (path.replace('/', '__') + '.svg')
    if not f.exists():
        f.write_bytes(urllib.request.urlopen(CDN + path + '.svg', timeout=30).read())
    return f.read_text(encoding='utf-8')

def symbol(path):
    s = fetch(path)
    vb = re.search(r'viewBox="([^"]+)"', s).group(1)
    inner = re.search(r'<svg[^>]*>(.*)</svg>', s, re.S).group(1)
    inner = re.sub(r'<title>.*?</title>', '', inner, flags=re.S)
    return f'<symbol id="{sym_id(path)}" viewBox="{vb}">{inner}</symbol>'

def tw(label):
    w = 0
    for ch in label:
        o = ord(ch)
        if 0xAC00 <= o <= 0xD7A3 or o > 0x2E80: w += 13.4
        elif ch.isupper(): w += 9.4
        elif ch.isdigit(): w += 8.2
        elif ch.isalpha(): w += 7.8
        else: w += 4.6
    return w

CHIP = re.compile(r'<rect\b(?P<ra>[^>]*\bclass="svc (?P<cat>[a-z]+)"[^>]*)/>(?P<ws>\s*)<text\b(?P<ta>[^>]*\bclass="tw"[^>]*)>(?P<label>[^<]+)</text>')
TEXT = re.compile(r'<text\b([^>]*)>')
def attr(s, k):
    m = re.search(r'\b' + k + r'="([-\d.]+)"', s)
    return float(m.group(1)) if m else None

def iconize(svg, used, stats):
    # 칩 안에 들어 있는 글자 개수 (두 줄 칩은 아이콘을 넣지 않음)
    texts = [(attr(t, 'x'), attr(t, 'y')) for t in TEXT.findall(svg)]
    def inside(x, y, w, h):
        return sum(1 for tx, ty in texts if tx is not None and ty is not None and x <= tx <= x + w and y <= ty <= y + h)
    def rep(m):
        label = m.group('label').strip()
        ic = next((p for rx, p in MAP if rx.search(label)), None)
        x, y, w, h = (attr(m.group('ra'), k) for k in ('x', 'y', 'width', 'height'))
        if ic is None or None in (x, y, w, h) or 'transform' in m.group('ra') or 'transform' in m.group('ta'):
            stats['skip'] += 1; return m.group(0)
        if inside(x, y, w, h) > 1 or h > 56 or h < 22:
            stats['multi'] = stats.get('multi', 0) + 1; return m.group(0)
        s = max(16, min(h - 10, 24))
        gw = s + 6 + tw(label)
        if gw > w - 8:
            s = min(18, h - 8); gw = s + 6 + tw(label)
            if gw > w - 8: stats['nofit'] += 1; return m.group(0)
        start = x + (w - gw) / 2; iy = y + (h - s) / 2
        nx = round(start + s + 6 + tw(label) / 2, 1)
        ta = re.sub(r'\bx="[-\d.]+"', f'x="{nx}"', m.group('ta'), count=1)
        used.add(ic); stats['ok'] += 1
        return (f'<rect{m.group("ra")}/>{m.group("ws")}<g class="ico" data-x="{x}" data-w="{w}" data-s="{s}">'
                f'<rect x="{round(start,1)}" y="{iy}" width="{s}" height="{s}" rx="4" fill="#fff"/>'
                f'<use href="#{sym_id(ic)}" x="{round(start + 1.5,1)}" y="{iy + 1.5}" width="{s - 3}" height="{s - 3}"/></g>'
                f'<text{ta}>{m.group("label")}</text>')
    return CHIP.sub(rep, svg)

def process(dgm):
    used, stats = set(MODULE_ICONS.values()), {'ok': 0, 'nofit': 0, 'skip': 0}
    for k, figs in dgm.items():
        for f in figs: f['svg'] = iconize(f['svg'], used, stats)
    sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + ''.join(symbol(p) for p in sorted(used)) + '</defs></svg>'
    mods = {m: sym_id(p) for m, p in MODULE_ICONS.items()}
    return sprite, mods, stats, len(used)
