import { Workspace, SolutionDiagram } from '../types/index';
import { v4 as uuid } from 'uuid';

export function buildMockDiagrams(workspace: Workspace): SolutionDiagram[] {
  const industry = workspace.industry || '制造业';
  const customer = workspace.customerName || '客户';

  const businessFlow: SolutionDiagram = {
    id: uuid(),
    type: 'business-flow',
    title: `${customer} 业务数据流向图`,
    description: '展示从数据源到报表分析的业务数据流向',
    mermaidCode: `
graph LR
  subgraph 数据源层
    A1[(ERP系统)]
    A2[(MES系统)]
    A3[(CRM系统)]
    A4[(业务数据库)]
  end

  subgraph 数据集成层
    B1[FineDataLink\n数据集成平台]
  end

  subgraph 帆软平台层
    C1[FineReport\n报表设计]
    C2[FineBI\n自助分析]
    C3[决策平台\n统一门户]
  end

  subgraph 用户访问层
    D1[管理层\n经营驾驶舱]
    D2[业务人员\n日常报表]
    D3[分析师\n数据探索]
  end

  A1 --> B1
  A2 --> B1
  A3 --> B1
  A4 --> B1
  B1 --> C1
  B1 --> C2
  C1 --> C3
  C2 --> C3
  C3 --> D1
  C3 --> D2
  C3 --> D3
`.trim(),
  };

  const techArchitecture: SolutionDiagram = {
    id: uuid(),
    type: 'tech-architecture',
    title: `${customer} ${industry} 技术架构图`,
    description: '帆软产品技术部署与系统集成架构',
    mermaidCode: `
graph TB
  subgraph 业务系统层
    S1[ERP]
    S2[MES/WMS]
    S3[OA/HR]
    S4[第三方API]
  end

  subgraph 数据层
    D1[(业务数据库\nOracle/MySQL)]
    D2[(数据仓库\nHive/ClickHouse)]
    D3[(实时数据\nKafka/Flink)]
  end

  subgraph 帆软平台
    P1[FineDataLink\n数据集成与治理]
    P2[FineReport 11\n报表与打印]
    P3[FineBI 7.0\n自助BI分析]
    P4[帆软决策平台\n统一入口门户]
  end

  subgraph 权限与安全
    R1[LDAP/AD\n单点登录]
    R2[行列权限\n数据权限]
    R3[操作审计\n日志管理]
  end

  subgraph 用户终端
    U1[PC浏览器]
    U2[移动端App]
    U3[大屏展示]
  end

  S1 & S2 & S3 & S4 --> D1
  D1 --> P1
  D2 --> P1
  D3 --> P1
  P1 --> P2
  P1 --> P3
  P2 & P3 --> P4
  R1 --> P4
  R2 --> P4
  R3 --> P4
  P4 --> U1
  P4 --> U2
  P4 --> U3
`.trim(),
  };

  return [businessFlow, techArchitecture];
}
