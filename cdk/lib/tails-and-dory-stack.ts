import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
export class TailsAndDoryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dortforshortZone = route53.HostedZone.fromLookup(this, 'DortforshortZone', {
      domainName: 'dortforshort.com',
    });

    const tailsthepomZone = route53.HostedZone.fromLookup(this, 'TailsthepomZone', {
      domainName: 'tailsthepom.com',
    });

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: 'dortforshort.com',
      subjectAlternativeNames: [
        'www.dortforshort.com',
        'tailsthepom.com',
        'www.tailsthepom.com',
      ],
      validation: acm.CertificateValidation.fromDnsMultiZone({
        'dortforshort.com': dortforshortZone,
        'www.dortforshort.com': dortforshortZone,
        'tailsthepom.com': tailsthepomZone,
        'www.tailsthepom.com': tailsthepomZone,
      }),
    });

    const redirectFunction = new cloudfront.Function(this, 'RedirectFunction', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var host = event.request.headers.host.value;
  if (host === 'dortforshort.com' || host === 'www.dortforshort.com') {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: 'https://tailsthepom.com' + event.request.uri },
      },
    };
  }
  return event.request;
}
      `),
    });

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [{
          function: redirectFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        }],
      },
      domainNames: [
        'dortforshort.com',
        'www.dortforshort.com',
        'tailsthepom.com',
        'www.tailsthepom.com',
      ],
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    const cfTarget = route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution));

    new route53.ARecord(this, 'DortforshortARecord', {
      zone: dortforshortZone,
      target: cfTarget,
    });

    new route53.ARecord(this, 'DortforshortWwwARecord', {
      zone: dortforshortZone,
      recordName: 'www',
      target: cfTarget,
    });

    new route53.ARecord(this, 'TailsthepomARecord', {
      zone: tailsthepomZone,
      target: cfTarget,
    });

    new route53.ARecord(this, 'TailsthepomWwwARecord', {
      zone: tailsthepomZone,
      recordName: 'www',
      target: cfTarget,
    });

    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront URL for the Tails and Dory website',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
    });
  }
}
