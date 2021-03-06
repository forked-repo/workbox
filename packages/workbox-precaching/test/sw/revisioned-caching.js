/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/* eslint-env mocha, browser */

import RevisionedCacheManager
    from '../../src/lib/controllers/revisioned-cache-manager.js';

describe(`sw/revisioned-caching()`, function() {
  let cacheManager;

  const VALID_PATH_REL = '/__echo/date/example.txt';
  const VALID_PATH_ABS = `${location.origin}${VALID_PATH_REL}`;
  const VALID_REVISION = '1234';

  beforeEach(function() {
    cacheManager = new RevisionedCacheManager();
  });

  afterEach(function() {
    cacheManager._close();
    cacheManager = null;
  });

  const badRevisionFileInputs = [
    undefined,
    '',
    '/example.js',
    {},
    {url: 'hello'},
    {revision: '0987'},
    true,
    false,
    123,
    new Request(VALID_PATH_ABS),
    new Request(VALID_PATH_REL),
  ];
  badRevisionFileInputs.forEach((badInput) => {
    it(`should handle bad cacheRevisioned({revisionedFiles='${badInput}'}) input`, function() {
      expect(() => {
        cacheManager.addToCacheList({
          revisionedFiles: badInput,
        });
      }).to.throw(`instance of 'Array'`);
    });

    it(`should handle bad cacheRevisioned('${badInput}') input`, function() {
      expect(() => {
        cacheManager.addToCacheList(badInput);
      }).to.throw(`instance of 'Array'`);
    });
  });

  it(`should handle bad cacheRevisioned('[]') input`, function() {
    expect(() => {
      cacheManager.addToCacheList([]);
    }).to.throw(`instance of 'Array'`);
  });

  it(`should handle cacheRevisioned(null / undefined) inputs`, function() {
    expect(() => {
      cacheManager.addToCacheList({revisionedFiles: null});
    }).to.throw(`instance of 'Array'`);

    expect(() => {
      cacheManager.addToCacheList(null);
    }).to.throw('null');
  });

  it(`should handle cacheRevisioned null array inputs`, function() {
    expect(() => {
      cacheManager.addToCacheList({revisionedFiles: [null]});
    }).to.throw().with.property('name', 'unexpected-precache-entry');
  });

  it(`should handle cacheRevisioned undefined array inputs`, function() {
    expect(() => {
      cacheManager.addToCacheList({revisionedFiles: [undefined]});
    }).to.throw().with.property('name', 'unexpected-precache-entry');
  });

  const badPaths = [
    null,
    undefined,
    false,
    true,
    12345,
    {},
    [],
  ];
  badPaths.forEach((badPath) => {
    it(`should throw an errror for bad path value '${JSON.stringify(badPath)}'`, function() {
      let caughtError;
      try {
        cacheManager.addToCacheList({revisionedFiles: [badPath]});
      } catch (err) {
        caughtError = err;
      }

      if (!caughtError) {
        throw new Error('Expected file manifest to cause an error.');
      }
      // TODO: Changed assertion library to support throwing custom errors.
      // caughtError.name.should.equal('invalid-revisioned-entry');
      console.log(caughtError);
    });

    it(`should throw an errror for bad path value with valid revision '${JSON.stringify(badPath)}'`, function() {
      let caughtError;
      try {
        cacheManager.addToCacheList({revisionedFiles: [{url: badPath, revision: VALID_REVISION}]});
      } catch (err) {
        caughtError = err;
      }

      if (!caughtError) {
        throw new Error('Expected file manifest to cause an error.');
      }
      // TODO: Changed assertion library to support throwing custom errors.
      // caughtError.name.should.equal('invalid-revisioned-entry');
      console.log(caughtError);
    });
  });

  const invalidTypeRevisions = [
    null,
    false,
    true,
    12345,
    {},
    [],
  ];
  invalidTypeRevisions.forEach((invalidRevision) => {
    it(`should throw an error for bad revision value '${JSON.stringify(invalidRevision)}'`, function() {
      let caughtError;
      try {
        cacheManager.addToCacheList({revisionedFiles: [{url: VALID_PATH_REL, revision: invalidRevision}]});
      } catch (err) {
        caughtError = err;
      }

      if (!caughtError) {
        throw new Error('Expected file manifest to cause an error.');
      }

      caughtError.message.indexOf(`The 'revision' parameter has the wrong type`).should.not.equal(-1);
    });
  });

  it(`should throw an error for an empty string revision.`, function() {
    let caughtError;
    try {
      cacheManager.addToCacheList({revisionedFiles: [{url: VALID_PATH_REL, revision: ''}]});
    } catch (err) {
      caughtError = err;
    }

    if (!caughtError) {
      throw new Error('Expected file manifest to cause an error.');
    }

    caughtError.name.should.equal('invalid-object-entry');
    caughtError.extras.should.deep.equal({problemParam: 'revision', problemValue: ''});
  });

  const badCacheBusts = [
    null,
    '',
    '1234sgdgh',
    12345,
    {},
    [],
  ];

  badCacheBusts.forEach((badCacheBust) => {
    it(`should be able to handle bad cacheBust value '${JSON.stringify(badCacheBust)}'`, function() {
      let caughtError;
      try {
        cacheManager.addToCacheList({revisionedFiles: [
          {url: VALID_PATH_REL, revision: VALID_REVISION, cacheBust: badCacheBust},
        ]});
      } catch (err) {
        caughtError = err;
      }

      if (!caughtError) {
        throw new Error('Expected file manifest to cause an error.');
      }

      // TODO: Move assertion library over to custom errors.
      // caughtError.name.should.equal('invalid-revisioned-entry');
    });
  });

  const goodManifestInputs = [
    VALID_PATH_REL,
    {url: VALID_PATH_REL, revision: VALID_REVISION},
    {url: VALID_PATH_REL, revision: VALID_REVISION, cacheBust: true},
    {url: VALID_PATH_REL, revision: VALID_REVISION, cacheBust: false},
    VALID_PATH_ABS,
    {url: VALID_PATH_ABS, revision: VALID_REVISION},
    {url: VALID_PATH_ABS},
    {url: VALID_PATH_ABS, revision: VALID_REVISION, cacheBust: true},
    {url: VALID_PATH_ABS, revision: VALID_REVISION, cacheBust: false},
  ];
  goodManifestInputs.forEach((goodInput) => {
    it(`should be able to handle good cache input '${JSON.stringify(goodInput)}'`, function() {
      cacheManager.addToCacheList({revisionedFiles: [goodInput]});
    });
  });

  it(`should throw error when precaching the same path but different revision`, function() {
    const TEST_PATH = '/__echo/date/hello.txt';
    let thrownError = null;
    try {
      cacheManager.addToCacheList({revisionedFiles: [
        {url: TEST_PATH, revision: '1234'},
      ]});
      cacheManager.addToCacheList({revisionedFiles: [
        {url: TEST_PATH, revision: '5678'},
      ]});
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    thrownError.name.should.equal('duplicate-entry-diff-revisions');
    thrownError.extras.should.deep.equal({
      firstEntry: {
        url: new URL(TEST_PATH, self.location).toString(),
        revision: '1234',
      },
      secondEntry: {
        url: new URL(TEST_PATH, self.location).toString(),
        revision: '5678',
      },
    });
  });

  it(`should clean up IDB after a URL is removed from the precache list`, async function() {
    const urls = [1, 2, 3].map((i) => new URL(`/__echo/date/${i}`, location).href);

    const firstRevisionedFiles = urls.map((url) => {
      return {url, revision: 'dummy-revision'};
    });
    cacheManager.addToCacheList({revisionedFiles: firstRevisionedFiles});

    const firstCacheDetails = await cacheManager.install();
    let updatedCount = 0;
    let notUpdatedCount = 0;
    firstCacheDetails.forEach((cacheDetails) => {
      if (cacheDetails.wasUpdated) {
        updatedCount++;
      } else {
        notUpdatedCount++;
      }
    });
    expect(updatedCount).to.equal(3);
    expect(notUpdatedCount).to.equal(0);

    await cacheManager.cleanup();

    const firstIdbUrls = await cacheManager._revisionDetailsModel._idbHelper.getAllKeys();
    expect(firstIdbUrls).to.include.members(urls);

    // Create a new RevisionedCacheManager to trigger a new installation.
    const secondCacheManager = new RevisionedCacheManager();

    const removedUrl = urls.pop();
    const secondRevisionedFiles = urls.map((url) => {
      return {url, revision: 'dummy-revision'};
    });
    secondCacheManager.addToCacheList({revisionedFiles: secondRevisionedFiles});

    const secondCacheDetails = await secondCacheManager.install();
    updatedCount = 0;
    notUpdatedCount = 0;
    secondCacheDetails.forEach((cacheDetails) => {
      if (cacheDetails.wasUpdated) {
        updatedCount++;
      } else {
        notUpdatedCount++;
      }
    });
    expect(updatedCount).to.equal(0);
    expect(notUpdatedCount).to.equal(2);

    await secondCacheManager.cleanup();

    const secondIdbUrls = await secondCacheManager._revisionDetailsModel._idbHelper.getAllKeys();
    expect(secondIdbUrls).to.include.members(urls);
    expect(secondIdbUrls).not.to.include.members([removedUrl]);
  });

  it(`should return empty array from install() if no resources to precache`, async function() {
    const cacheDetails = await cacheManager.install();
    (Array.isArray(cacheDetails)).should.equal(true);
    (cacheDetails.length).should.equal(0);
  });
});
