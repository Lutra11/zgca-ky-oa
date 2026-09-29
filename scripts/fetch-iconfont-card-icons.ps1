$ErrorActionPreference = 'Stop'

$IconDir = Join-Path $PSScriptRoot '..\src\dataset\icon'
$ApiUrl = 'https://www.iconfont.cn/api/icon/search.json'
$PrimaryColor = '#3478E5'
$CanvasSize = 128
$Padding = 22

Add-Type -AssemblyName PresentationCore,WindowsBase

$IconRequests = @(
  [pscustomobject]@{ File = 'batch-management.png'; Keywords = @('批次管理', '批次') },
  [pscustomobject]@{ File = 'project-application.png'; Keywords = @('项目申报', '申报') },
  [pscustomobject]@{ File = 'declaration-review.png'; Keywords = @('材料审查', '审核') },
  [pscustomobject]@{ File = 'review-organization.png'; Keywords = @('评审组织', '组织') },
  [pscustomobject]@{ File = 'expert-review.png'; Keywords = @('专家评审', '专家') },
  [pscustomobject]@{ File = 'project-approval.png'; Keywords = @('项目立项', '审批通过') },
  [pscustomobject]@{ File = 'external-project-archive.png'; Keywords = @('项目导入', '导入') },
  [pscustomobject]@{ File = 'application-query.png'; Keywords = @('查询', '搜索') },
  [pscustomobject]@{ File = 'project-library.png'; Keywords = @('项目库', '项目管理') },
  [pscustomobject]@{ File = 'project-launch.png'; Keywords = @('项目启动', '启动') },
  [pscustomobject]@{ File = 'project-recruitment-overview.png'; Keywords = @('招聘', '招募') },
  [pscustomobject]@{ File = 'finance-workbench.png'; Keywords = @('财务工作台', '财务') },
  [pscustomobject]@{ File = 'budget-management.png'; Keywords = @('预算管理', '预算') },
  [pscustomobject]@{ File = 'finance-alert.png'; Keywords = @('预警', '警告') },
  [pscustomobject]@{ File = 'reconciliation.png'; Keywords = @('对账', '纠错') },
  [pscustomobject]@{ File = 'paper-outcomes.png'; Keywords = @('论文', '文档') },
  [pscustomobject]@{ File = 'open-source.png'; Keywords = @('开源', '代码') },
  [pscustomobject]@{ File = 'intellectual-property.png'; Keywords = @('知识产权', '专利') },
  [pscustomobject]@{ File = 'analytics-dashboard.png'; Keywords = @('驾驶舱', '数据看板') },
  [pscustomobject]@{ File = 'initiation-analysis.png'; Keywords = @('立项分析', '分析') },
  [pscustomobject]@{ File = 'ongoing-project-analysis.png'; Keywords = @('项目分析', '折线图') },
  [pscustomobject]@{ File = 'quarter-analysis.png'; Keywords = @('季度分析', '日历') },
  [pscustomobject]@{ File = 'finance-analysis.png'; Keywords = @('经费分析', '财务分析') },
  [pscustomobject]@{ File = 'outcome-analysis.png'; Keywords = @('成果分析', '奖杯') },
  [pscustomobject]@{ File = 'team-analysis.png'; Keywords = @('团队分析', '团队') },
  [pscustomobject]@{ File = 'organization-management.png'; Keywords = @('组织机构', '组织') },
  [pscustomobject]@{ File = 'people-library.png'; Keywords = @('人员库', '人员') },
  [pscustomobject]@{ File = 'expert-library.png'; Keywords = @('专家库', '专家') },
  [pscustomobject]@{ File = 'project-config.png'; Keywords = @('项目配置', '配置') },
  [pscustomobject]@{ File = 'review-index.png'; Keywords = @('评审指标', '指标') },
  [pscustomobject]@{ File = 'template-management.png'; Keywords = @('模板管理', '模板') },
  [pscustomobject]@{ File = 'announcement-publishing.png'; Keywords = @('公告发布', '公告') },
  [pscustomobject]@{ File = 'workflow-config.png'; Keywords = @('审批流程', '流程') },
  [pscustomobject]@{ File = 'user-account.png'; Keywords = @('用户账号', '用户') },
  [pscustomobject]@{ File = 'role-permission.png'; Keywords = @('权限管理', '权限') },
  [pscustomobject]@{ File = 'approval-process.png'; Keywords = @('审批流程', '审批') },
  [pscustomobject]@{ File = 'message-reminder.png'; Keywords = @('消息提醒', '消息') },
  [pscustomobject]@{ File = 'data-sync.png'; Keywords = @('数据同步', '同步') },
  [pscustomobject]@{ File = 'file-storage.png'; Keywords = @('文件存储', '文件') },
  [pscustomobject]@{ File = 'audit-log.png'; Keywords = @('操作日志', '日志') },
  [pscustomobject]@{ File = 'initiation-launch.png'; Keywords = @('发起立项', '立项') },
  [pscustomobject]@{ File = 'external-import.png'; Keywords = @('外部导入', '导入') },
  [pscustomobject]@{ File = 'my-project.png'; Keywords = @('我的项目', '项目') },
  [pscustomobject]@{ File = 'recruitment-management.png'; Keywords = @('招聘管理', '招募') },
  [pscustomobject]@{ File = 'application-approval.png'; Keywords = @('申请审批', '审批') },
  [pscustomobject]@{ File = 'member-management.png'; Keywords = @('成员管理', '成员') },
  [pscustomobject]@{ File = 'my-finance.png'; Keywords = @('我的经费', '经费') },
  [pscustomobject]@{ File = 'my-paper.png'; Keywords = @('我的论文', '论文') },
  [pscustomobject]@{ File = 'my-ip.png'; Keywords = @('知识产权', '版权') },
  [pscustomobject]@{ File = 'my-patent.png'; Keywords = @('专利', '证书') },
  [pscustomobject]@{ File = 'recruitment-square.png'; Keywords = @('招募广场', '广场') },
  [pscustomobject]@{ File = 'my-application.png'; Keywords = @('我的申请', '申请') },
  [pscustomobject]@{ File = 'quarterly-review.png'; Keywords = @('季度评审', '评审') },
  [pscustomobject]@{ File = 'data-maintenance.png'; Keywords = @('数据维护', '维护') },
  [pscustomobject]@{ File = 'template-build.png'; Keywords = @('模板搭建', '模板') },
  [pscustomobject]@{ File = 'review-projects.png'; Keywords = @('项目评审', '评审') },
  [pscustomobject]@{ File = 'review-management.png'; Keywords = @('评审管理', '评审') },
  [pscustomobject]@{ File = 'review-material.png'; Keywords = @('材料提交', '材料') },
  [pscustomobject]@{ File = 'material-achievement.png'; Keywords = @('成果维护', '成果') },
  [pscustomobject]@{ File = 'review-results.png'; Keywords = @('评审结果', '结果') },
  [pscustomobject]@{ File = 'evaluation-360.png'; Keywords = @('360评价', '评价') }
)

function Convert-HexColorToBrush {
  param([string]$HexColor)

  $hex = $HexColor.TrimStart('#')
  $color = [System.Windows.Media.Color]::FromRgb(
    [Convert]::ToByte($hex.Substring(0, 2), 16),
    [Convert]::ToByte($hex.Substring(2, 2), 16),
    [Convert]::ToByte($hex.Substring(4, 2), 16)
  )

  $brush = [System.Windows.Media.SolidColorBrush]::new($color)
  $brush.Freeze()

  return $brush
}

function Find-IconfontSvg {
  param([string[]]$Keywords)

  foreach ($keyword in $Keywords) {
    $body = @{
      q = $keyword
      sortType = 'updated_at'
      page = 1
      pageSize = 12
      sType = ''
      fromCollection = -1
      fills = ''
      t = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
      ctoken = 'null'
    }

    try {
      $response = Invoke-RestMethod `
        -Uri $ApiUrl `
        -Method Post `
        -Body $body `
        -ContentType 'application/x-www-form-urlencoded; charset=UTF-8' `
        -Headers @{
          'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          'Accept' = 'application/json, text/plain, */*'
          'Accept-Language' = 'zh-CN,zh;q=0.9,en;q=0.8'
        }

      if ($response.code -eq 200 -and $response.data.icons) {
        $candidate = @($response.data.icons | Where-Object { $_.show_svg -and $_.width -gt 0 -and $_.height -gt 0 } | Select-Object -First 1)

        if ($candidate.Count -gt 0) {
          return [pscustomobject]@{
            Keyword = $keyword
            IconId = $candidate[0].id
            IconName = $candidate[0].name
            Svg = $candidate[0].show_svg
          }
        }
      }
    } catch {
      Write-Warning "Search failed for keyword '$keyword': $($_.Exception.Message)"
    }

    Start-Sleep -Milliseconds 80
  }

  return $null
}

function Export-SvgPathToPng {
  param(
    [string]$Svg,
    [string]$OutFile
  )

  $viewBoxMatch = [regex]::Match($Svg, 'viewBox="([^"]+)"')
  if ($viewBoxMatch.Success) {
    $viewBox = $viewBoxMatch.Groups[1].Value -split '\s+'
    $minX = [double]$viewBox[0]
    $minY = [double]$viewBox[1]
    $width = [double]$viewBox[2]
    $height = [double]$viewBox[3]
  } else {
    $minX = 0
    $minY = 0
    $width = 1024
    $height = 1024
  }

  $pathMatches = [regex]::Matches($Svg, '<path\b[^>]*\sd="([^"]+)"[^>]*>')
  if ($pathMatches.Count -eq 0) {
    throw "No SVG path found"
  }

  $bitmap = [System.Windows.Media.Imaging.RenderTargetBitmap]::new(
    $CanvasSize,
    $CanvasSize,
    96,
    96,
    [System.Windows.Media.PixelFormats]::Pbgra32
  )
  $visual = [System.Windows.Media.DrawingVisual]::new()
  $context = $visual.RenderOpen()
  $context.DrawRectangle([System.Windows.Media.Brushes]::Transparent, $null, [System.Windows.Rect]::new(0, 0, $CanvasSize, $CanvasSize))

  $available = $CanvasSize - ($Padding * 2)
  $scale = [Math]::Min($available / $width, $available / $height)
  $offsetX = ($CanvasSize - ($width * $scale)) / 2
  $offsetY = ($CanvasSize - ($height * $scale)) / 2

  $transform = [System.Windows.Media.TransformGroup]::new()
  $transform.Children.Add([System.Windows.Media.TranslateTransform]::new(-$minX, -$minY))
  $transform.Children.Add([System.Windows.Media.ScaleTransform]::new($scale, $scale))
  $transform.Children.Add([System.Windows.Media.TranslateTransform]::new($offsetX, $offsetY))
  $context.PushTransform($transform)

  $brush = Convert-HexColorToBrush $PrimaryColor

  foreach ($pathMatch in $pathMatches) {
    $pathData = [System.Net.WebUtility]::HtmlDecode($pathMatch.Groups[1].Value)

    try {
      $geometry = [System.Windows.Media.Geometry]::Parse($pathData)
      $geometry.Freeze()
      $context.DrawGeometry($brush, $null, $geometry)
    } catch {
      Write-Warning "Path parse skipped: $($_.Exception.Message)"
    }
  }

  $context.Pop()
  $context.Close()
  $bitmap.Render($visual)

  $encoder = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
  $stream = [System.IO.File]::Create($OutFile)
  try {
    $encoder.Save($stream)
  } finally {
    $stream.Close()
  }
}

New-Item -Path $IconDir -ItemType Directory -Force | Out-Null
Remove-Item -LiteralPath (Join-Path $IconDir '_wpf_test.png') -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $IconDir '_iconfont_test.png') -Force -ErrorAction SilentlyContinue

$results = New-Object System.Collections.Generic.List[object]

foreach ($request in $IconRequests) {
  $icon = Find-IconfontSvg $request.Keywords
  if (-not $icon) {
    Write-Warning "No icon found for $($request.File)"
    continue
  }

  $outFile = Join-Path $IconDir $request.File
  Export-SvgPathToPng -Svg $icon.Svg -OutFile $outFile

  $results.Add([pscustomobject]@{
    file = $request.File
    keyword = $icon.Keyword
    iconId = $icon.IconId
    iconName = $icon.IconName
  })

  Write-Host "saved $($request.File) from iconfont icon $($icon.IconId)"
}

$results | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $PSScriptRoot 'iconfont-card-icons-manifest.json') -Encoding UTF8
Write-Host "generated $($results.Count) icon png files"
