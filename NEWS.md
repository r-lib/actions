# Development version

* `[setup-r]` now installs gfortran 14.2 for R 4.5.0 and later (#965).

* `[setup-r]` now does not use PPM on aarch64 Linux, because PPM
  does not have binary packages for aarch64 Linux, and it would send
  x86_64 binarires for aarch64 systems as well.

# `v2.11.1` (2024-11-25)

* `[setup-r]` now unlinks the pre-installed pkg-config brew package
  to fix a clash with the new pkgconf package (#948).

# `v2.11.0` (2024-11-09)

* `[setup-r-dependencies]` parameter `pak-version` can now be `repo` or
  `none` as well. `repo` means that the action will install pak from
  the configured repositories, using `install.packages()`. `repo` is
  appropriate on systems that do not have access to our pak repository
  on GitHUb. `none` means that the action does not install pak at all.
  Use this if you want to install pak yourself manually. Set the
  `R_LIB_FOR_PAK` environment variable to point to the library where pak
  is installed.

* `[setup-r]` now has a `working-directory` parameter, to be able to
  specify the location of the `renv.lock` file (#922, @calderonsamuel).

* Example check-like workflows now run on all pull requests, not only
  on pull requests against the `main` branch.

* `[setup-r-dependencies]` and `[setup-renv]` now do not use the
  deprecated `save-always` parameter of `actions/cache`.

* `[setup-renv]` now correctly accepts `bypass-cache: never`, as stated
  in the documentation.

* `[setup-r-dependencies]` now saves the package cache correctly on
  Windows with older R (#940).

# `v2.10.1` (2024-08-08)

* `[setup-r-dependencies]` now pins `quarto-dev/quarto-actions/setup`
  version to a constant sha, to be compatible with organizations where
  this is a requirement (#901).

* `[setup-renv]` now also caches R packages in `renv/library`, used when
  `RENV_CONFIG_PAK_ENABLED: true` (#900).

* `[setup-manifest]`: new action to set up an R project with a Posit
  Connect `manifest.json` file (#880).

# `v2.10.0` (2024-08-02)

* `[setup-r]`: on R 3.6.x we now use the P3M snapshot from 2024-06-01 by
  default. This is because many newer CRAN packages do not work on R 3.6.x
  any more. The default CRAN mirror is still added, so newer packages may
  be used if they are required, but `setup-r-dependencies@v2` will prefer
  the binary packages from P3M.

  Note that this only happens if you opt in to use P3M with the
  `use-public-rspm: true` input parameter. This is the default in all
  example workflows.

  If the `RSPM` environment variable is already set, then it is used
  unchanged, on all R versions. To avoid using a P3M snapshot on R 3.6.x,
  set the `RSPM_PIN_3_6` environment variable to `false`.

* `[setup-r]` now installs the x86_64 build of R on arm64 macOS, if there
  is no arm64 build available for this R version (#883).

* Example blogdown, bookdown, document, pr-commands and render-markdown
  workflows now correctly have write permission to repository contents
  (#874, @remlapmot).

* `[check-r-package]`: you can now set`upload-snapshots` to `always`, to
  upload snapshots even after failures (#871).

* `[setup-r-dependencies]` now always sets the `R_LIBS_USER` GitHub
  environment variable, so it can be used without `[setup-r]` or without
  setting it manually (#881).

* The example workflows now use their file names as workflow names.
  This is to make it easier to match worflow runs to workflow files.
  Most of the the `check-*` workflows use `R-CMD-check.yaml`, however,
  to anticipate the usethis package renaming them by default (#888).

* `[setup-renv]`: you can now set `bypass-cache` to `never`, to save the
  cache even if the workflow fails (#873, @jaradkohl-mfj).

* `[setup-pandoc]`: installing nightly Pandoc works again now (#889).

* `[setup-r-dependencies]` now automatically installs Quarto if the repo
  has a qmd file, and it isn't installed. See the `install-quarto` and
  `quarto-version` input parameters (#866).

* `[setup-r]` now avoids spurious warnings from Homebrew (#864).

* `[setup-r-dependencies]` now accepts `pak-version: none` to skip pak
  installation. pak should be already installed on the system in this
  case, otherwise the dependencies resolution and installation will fail.
  You probably also need to set the `R_LIB_FOR_PAK` env var to the library
  where it is installed.

# `v2.9.0` (2024-05-09)

* The `test-coverage.yaml` example workflow now handles global Codecov
  tokens for test coverage uploads to codecov.io
  (@ALanguillaume, @gaborcsardi, #823).

* The `check-full.yaml` example does not test on R 3.6.x any more.

* All example workflows set the default permissions now to read-only.

* We deleted the (long broken) `run-rchk` action.
  [R-hub](https://r-hub.github.io/rhub/) will have an `rchk` container and builder soon: https://github.com/r-hub/containers/issues/29.

* [setup-r-dependencies]: new option to save the R package cache for
  unsuccessful workflow runs as well (@schloerke, #695).

* New example workflows `bookdown-gh-pages` and `blogdown-gh-pages` to
  deploy bookdown books and blogdown sites to GH Pages without commiting
  them into the repository (#856).

# `v2.8.7` (2024-04-05)

* `[setup-r-dependencies]` now has a `lockfile-create-lib` input parameter, that is
  passed to `pak::lockfile_create(lib = ...)` (#814).

# `v2.8.6` (2024-03-30)

* `[setup-r]` now does not install qpdf on Windows, because it is part of all Rtools
  versions that we use. Also, it installs Ghostscript from a `.zip` file instead of a
  `choco` package, because `choco install` can sometimes freeze (#812).

# `v2.8.5` (2024-03-26)

* `[setup-r]` uses a different tag name to download system packages from on
  Windows. This is to fix https://github.com/r-lib/usethis/issues/1967.

# `v2.8.4` (2024-03-25)

* `[setup-r]`: Ghostscript and QPDF installation is now more robust on Windows.
  We download and install manually, instead of installing from the Chocolatey
  repository (#812).

# `v2.8.3` (2024-03-20)

* `[setup-r]` now sets the `HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK=true`
  environment variable when installation associated tools on macOS. Without this `brew`
  often fails on outdated Homebrew installations (#810).
* `[setup-r-dependencies]` now works on aarch64 Linux.

# `v2.8.2` (2024-03-18)

* `[setup-r]` now supports Rtools44, and installs Rtools44 for R 4.4.x (currently R-devel).
* `[check-r-package]` now supports `upload-results: never` to never upload
   check results as artifacts. This is useful if you want to handle artifact uploads
   yourself.

# `v2.8.1` (2024-02-29)

* `[setup-r-dependencies]`: fix Pandoc auto-installation (#808).

# `v2.8.0` (2024-02-27)

* `[setup-r]` now allows `rtools-version: none` to skip installing Rtools (#767).
* `[setup-pandoc]`: The default version is 3.1.11 now.
* `[setup-pandoc]` can now install the latest pandoc version, or the pandoc nightly build.
* `[setup-pandoc]` now supports arm64 macOS and any amd64 or arm64 Linux distribution.
* `[setup-r-dependencies]` now installs pandoc if the R package depends on the rmarkdown package.
* `[check-r-package]` now has inputs `artifact-name` and `snapshot-artifact-name` to specify artifact names explicitly (#800).
* The styler example now sets permissions correctly (#775, @thisisnic).
* The test coverage example now handles paths with spaces or special characters (#782, @Felixmil).
* The check example workflows now use a better `build_args` parameter (#787).

# `v2.7.2` (2024-02-01)

* `[check-r-package]` now uses better artifact names. It includes `matrix.config.id` from the job matrix in the artifact name. If that's not defined then the zero-based job index in the matrix is used. For non-matrix jobs, this is `0`.

# `v2.7.1` (2024-01-31)

* `[check-r-package]` now includes the runner architecture in the name of the test output artifact, to avoid a name clash between `macos-14` and other macOS runners.

# `v2.7.0` (2024-01-31)

* `[setup-r]` now removes Homebrew R from the PATH on macOS. With this `setup-r` works on the new arm64 `macos-14` platform.
* All actions and examples now use Node 20 actions.

# `v2.6.5` (2023-10-27)

* `[setup-r]` now tries to avoid `*.r-project.org` URLs, to work around a DNS issue.
* `[check-r-package]` now only sets `_R_CHECK_CRAN_INCOMING_=false` if it is not set already (@krlmlr, #764).
* `[setup-renv]` now has a `working-directory` parameter (@milanmlft, #770).
*  The example `test-coverage.yaml` workflow now works on Windows.

# `v2.6.4` (2023-07-14)

* `[setup-r-dependencies]` now works without `sudo` on Linux.
* `[setup-renv]` now only installs renv if not installed already, e.g. the installation of the correct renv version
   is typically triggered from the `.Rprofile` (#747).

# `v2.6.3` (2023-04-26)

* `[setup-r]` now installs gfortran 12.2 only for R 4.3.0 and newer, as it is not compatible with the
   R 4.1.x (and possibly other) R builds (#722).

# `v2.6.2` (2023-04-24)

* `[setup-r]` sets its `installed-r-version` output correctly again, to the actual R version number.
* `[setup-r]` now installs gfortran 12.2 for R 4.0.0 and newer. This fixes fortran compilation for
   R 4.3.0 and newer.

# `v2.6.1` (2023-04-21)

* `[setup-r]` observes the `rtools-version` input parameter again (#720).
* The pkgdown example now sets the permissions of the automatic `GITHUB_TOKEN`
  to allow deployment (#719, @jennybc).

# `v2.6.0` (2023-04-21)

* `[setup-r]` now does a better job resolving R version specifications.
*  The example workflow for styler now commits all styled files (#693, @dpprdan).

# `v2.5.0` (2023-04-01)

* `[setup-r]`: better cache key for R-devel: now the graphics engine API id and t	he internal R id are also included
   in the cache key (#699, @schloerke).
* `[setup-r]`: the `r-version` parameter can now be set to `renv`, to read the R version to install from the
   `renv.lock` file (#701, @iqis).
* `[setup-r]`: now installs Rtools43 for R 4.3.0 (current R-next) and later (#714).
* `[setup-r-dependencies]`: new input parameter: `upgrade`, whether to install the latest available package
   versions. Defaults to `FALSE`.
* `[setup-tinytex]`: handle tinytex 2023 change about windows directory (#712, @cderv).
* `[setup-pandoc]`: fix installation of Pandoc 3.1.2 (and possibly later) on macOS (#716, @IndrajeetPatil).
* The example `document.yaml` workflow now also saves the `DESCRIPTION` file (#694, @dpprdan).

# `v2.4.0` (2023-01-16)

* `[setup-r]`: supports Rtools43 now. On R-devel Windows Rtools43 is installed by default (#682).
* `[setup-renv]`: new input parameter: `bypass-cache` to skip the GitHub cache completely (#667, @davidski).
* The `style.yaml` example workflow now installs roxygen2 as well (#690, @dpprdan).
* The `document.yaml` and `style.yaml` example workflows now do not run for pull requests (#683, @arisp99).

# `v2.3.1` (2022-11-04)

* `[setup-r-dependencies]` is now compatible with renv again (#652).
* `[check-r-package]` now sets the `LOGNAME` environment variable, which is needed for an `R CMD check` test to work (#651).

# `v2.3.0` (2022-10-26)

* All node.js actions use node 16 now.
* `[check-r-package]` uploading artifacts works now when `working-directory` is set (#614, @riccardoporreca).
* `[setup-pandoc]` uses now pandoc version 2.19.2 by default.
* `[setup-r]` now sets `RENV_CONFIG_REPOS_OVERRIDE` to RSPM, if RSPM is requrested (#572).
* `[setup-r]` has a new `windows-path-include-rtools` parameter (#574).
* `[setup-r]` now installs ghostscript on all platforms, as it is sometimes needed for `R CMD check` (#583).
* `[setup-r-dependencies]` now installs pak into the site library. This helps checking packages that depend on pak (#640).
* `[setup-renv]` has a new `profile` parameter for the renv profile to use in `renv::activate()` (#649, @Bisaloo).

* All example workflows use actions relying on node 16 now.
* Example workflows using lintr now fail on lint errors now (#537).
* The `check-full` workflow now includes a check on Windows 4.1.x (#564).
* The `style` example how also supports Quarto `.qmd` files (#629, @IndrajeetPatil).
* New example workflow, `lint-changed-files`, to lint only the changed files (#567, @IndrajeetPatil).
* New example workflow, `check-no-suggests`, to run `R CMD check` with only the suggested packages (#549).
* The `test-coverage` workflow now prints the test results and on test failures it also uploads them as an artifact (#643).

# `v2.2.8` (2022-08-31)

* Examples now use `ubuntu-latest` instead of `ubuntu-20.04`. This avoid having to update your workflows every two years.
  It does not change anything right now, however, as `ubuntu-latest` is the same as `ubuntu-20.04` currently.

# `v2.2.7` (2022-08-23)

* HTML 5 check example now works for packages with vignettes (by ignoring them), #611.
* [setup-r] now adds Rtools40 to the PATH for Windows ucrt R versions, so R can compile packages again, #610.

# `v2.2.6` (2022-08-22)

* Examples now use Ubuntu 22.04, because 18.04 is deprecated on GHA.
* New example for HTML 5 checks: [examples/html-5-check.yaml](examples/html-5-check.yaml).

# `v2.2.5` (2002-08-05)

* `[check-r-package]` now correctly uploads artifacts after a check error (#593, #595).
* `shiny-deploy` example now works correctly.

# `v2.2.4` (2022-07-27)

* `[setup-r]` does not fix `release` to 4.2.0 any more.

# `v2.2.3` (2002-06-23)

* `[setup-r]` `release` is now fixed to R 4.2.0 on Linux, until we have the Linux binaries ready for R 4.2.1.
*  The lintr example workflow now installs the local package as well (#557,@dpprdan).
*  Artifact upload now works properly if `check-dir` is specified (#560, @riccardoporreca)

# `v2.2.2` (2022-04-25)

* `[setup-r]` `release` is not fixed to R 4.1.3 any more, on Linux.

# `v2.2.1` (2022-04-21)

* `[setup-r]` `release` is now fixed to R 4.1.3 on Linux, until we have the Linux binaries and RSPM binary packages
   ready for R 4.2.0.

# `v2.2.0` (2022-04-01)

* `[setup-r]` now supports `next` as an R version. It installs the next version of R. This is R-patched if there is no
   active release process. Otherwise it can be R-alpha, R-beta, R-rc or R-prerelease (#542).
* `[setup-r-dependencies]` has a new `cache` input parameter, which you can set to `false` to disable the cache
   (@Bisaloo, #530).
* `[setup-r-dependencies]` now removed the temporary `.github/pkg.lock` file after the package installation,
   to avoid a dirty git tree (@schloerke, #526).
* `[setup-pandoc]` now fails if it fails to install pandoc (@nikeee, #515).

# `v2.1.5` (2022-03-11)

* `[setup-r]`: remove workaround for R 4.1.3. `release` is R 4.1.3 now on Linux.

# `v2.1.4` (2022-03-10)

* `[check-r-package`: new `upload-results` parameter to be able to upload the result artifact for successful checks.
* `[setup-r]`: fix R installation for R `release`.

# `v2.1.3` (2022-02-18)

* `[setup-r-dependencies]`: the `pak-version` parameter defaults to "stable" now.
* `[setup-tinynex]` now fails if it fails to download or install TinyTeX (#505).

# `v2.1.2` (2022-02-16)

* `[setup-r]` now again adds Rtools40 to the path (#504, @nealrichardson).
* `[setup-r]` Rtools42 version updated to latest.

# `v2.1.1` (2022-02-14)

* `[setup-r-dependencies]` uses the correct cache key now, previously it was truncated.

# `v2.1.0` (2022-02-12)

* `[setup-r-dependencies]` now has a `packages` parameter, to override which package(s) to install (#486).
* `[setup-r]` now supports Rtools42. Pass `'42'` as the `rtools-version` parameter (#491).
* `[setup-r]`: the `windows-path-include-mingw` parameter is now defunct with Rtools40 and later, as it is not needed and possibly causes confusion.
* `[check-r-package]` has a new parameter: `upload-snapshots`, to upload testthat snapshots as artifacts (#473).
* The pkgdown, bookdown and blogdown examples now use concurrency groups to avoid race conditions when deploying the site (#476).
* The test-coverage example now keeps the output from covr, to make debugging easier (#481).
* Two new examples are included, to run `roxygen2::roxygenise()` and `styler::style_pkg()` on a repo and commit the results (#434).

# `v2.0.11` (2022-01-16)

* `[setup-r]` forces HTTP/1.1 for pak/pkgcache.
* `[setup-r-dependencies]` does the same. This _seems_ to fix crashes during package installation (#483).

# `v2.0.10` (2022-01-11)

* The pkgdown example now uses `clean: false` to allow a production and a dev site.

# `v2.0.9` (2022-01-11)

* `[setup-r]` now does not download qpdf on Windows, because it is already
  included in Rtools (#474).

# `v2.0.8` (2022-01-11)

* `[check-r-package]` does not print the environment now, because there is a slight chance that printing
  exposes processed secrets that GitHub's reduction mechanism misses.

# `v2.0.7` (2022-01-06)

* Simplified GitHub Pages deployment in the pkgdown example (#468).

# `v2.0.6` (2022-01-05)

* `[setup-r]` does not add the `ppa:cran/travis` PPA on Ubuntu, as it is not needed any more. (@jeroen, #465)
* `[setup-r]` macOS R-devel builds use a more robust R download URL now (@s-u, #466).
* `[setup-r-dependencies]` now uses the correct cache key if `working-directory` is specified (@harupy, #471)

# `v2.0.5` (2021-12-17)

* `[setup-r-dependencies]` now works with older versions of the sessioninfo package.
  (This typically happens on older R versions and Windows or macOS, where pak prefers
  to install an older binary package to a newer source package, unless the newer package
  is needed.)

# `v2.0.4` (2021-12-16)

* `[setup-r]` and `[setup-r-dependencies]` now have better organized output
* `[check-r-package]` now prints all environment variables before the check.

# `v2.0.3` (2021-12-15)

* `[setup-r]` and `[setup-r-dependencies]` do not treat R version `devel-ucrt` specially any more,
  and it is equivalent to `devel`.

# `v2.0.2` (2021-12-14)

* `[check-r-package]` now sets the `_R_CHECK_FORCE_SUGGESTS_=false`  environment variable,
  unless it was already set before to a non-empty value.

# `v2.0.1` (2021-12-13)

* `[setup-r-dependencies]` is now better at ignoring soft package dependencies that
  cannot be installed on the current R version. See more in the README here:
  https://github.com/r-lib/actions/tree/v2/setup-r-dependencies#ignoring-optional-dependencies-that-need-a-newer-r-version

# `v2.0.0` (2021-12-12)

## Breaking changes from `v1`

* `[check-r-package]`: many parameters have a new format now, and they need
  to be legal R expressions.
* `[setup-r]` does not have a `crayon.enabled` parameter now. You can update
  `.Rprofile` manually to set options if you like, see example in the README.

## New compared to `v1`

* `[check-r-package]` has a `working-direcytory` parameter now (#393).
* `[check-r-package]` prints the testthat output, and uploads artifacts on failure
  now, no need to do these in the workflow file.
* `[run-rchk]` is now a more flexible composite action (@randy3k, #380, #428).
* `[setup-pandoc]` now defaults to Pandoc version 2.14.2.
* `[setup-r]` more robust installation in macOS, hopefully the hangs are solved.
* `[setup-r]` now works on macOS Big Sur for older R versions (#412).
* `[setup-r-dependencies]` has more robust dependency and system dependency lookup
  and installation (#370, #386, #405, #419, #430, #431, #432, #437).
* `[setup-r-dependencies]` automatically uses the UCRT versions of packages on UCRT R.
* `[setup-r-dependencies]` has a `working-directory` parameter now (#393, #438).
* `[setup-r-dependencies]` has a less conservative cache key now for R-devel (#429).
* `[setup-r-dependencies]` now has a `dependencies` parameter to finetune which
  dependencies are installed (#409).

## Changes in example workflows from `v1`

* New example workflows, that work with the `v2` tag.
* Example pkgdown workflow builds releases now (#450).
* bookdown, blogdown and pkgdown examples now have workflow triggers to
  trigger a build manually.
* bookdown, blogdown and pkgdown examples now build on pull requests as
  well, without deploying (#363).
* Check examples omit showing the testtat output and the artifact upload
  on error, these are done in the `check-r-package` action now.

# `v1.0.2` (2022-10-24)

The `v1` versions of the actions are now formally deprecated, and they generate warning messages.

# `v1.0.1` (2021-12-15)

* `[setup-r]` and `[setup-r-dependencies]` do not treat R version `devel-ucrt` specially any more,
  and it is equivalent to `devel`.
