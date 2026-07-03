import { markDockviewPackageLoaded, registerModules } from 'dockview-core';
import { Modules } from '../index';
import { LicenseManager } from '../licenseRegistry';
import { fnv1a } from '../licenseValidator';

/**
 * Register this package's modules globally so a default `DockviewComponent`
 * constructed in tests has the full feature set, and mark the public package as
 * loaded so the "don't use dockview-core directly" warning stays quiet. (The
 * index self-registers on import too; both calls are idempotent.)
 */
registerModules(Modules);
markDockviewPackageLoaded();

/**
 * The bundle now includes `LicenseModule`, which renders a watermark on any
 * unlicensed component. Set a valid, far-future key so the feature suites are
 * never watermarked; the license-specific specs reset the registry per-test to
 * exercise the unlicensed paths. The checksum is computed at runtime so the key
 * always validates.
 */
const LICENSE_BODY =
    '[KeyId:TEST]_[Company:Tests]_[Plan:team]_[AppName:Tests]_[Email:test@test]_[ValidFrom:01_Jan_2020]_[ValidUntil:01_Jan_2999]';
LicenseManager.setLicenseKey(`${LICENSE_BODY}__${fnv1a(LICENSE_BODY)}`);
