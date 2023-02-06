const { Builder, By, until } = require('selenium-webdriver');
const driver = new Builder().forBrowser('chrome').build();
// ユーザからのキーボード入力を取得する Promise を生成する
function readUserInput(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    readline.question(question, (answer) => {
      resolve(answer);
      readline.close();
    });
  });
}

async function click(sel) {
  await wait(1);
  await driver.wait(until.elementLocated(By.css(sel)), 100000);
  await driver.executeScript(`document.querySelector('${sel}').click()`);
}
async function wait(num) {
  await new Promise((resolve) => {
    setTimeout(() => {}, num * 1000);
    resolve();
  });
}
async function find(sel) {
  return await driver.wait(until.elementLocated(By.css(sel)), 10000);
}

class AutoCloseModal {
  constructor() {
    this.IntervalId = undefined;
  }

  async setAuto() {
    function execute() {
      const id = setInterval(() => {
        const dialog = document.querySelector('.ui-dialog');
        const button = document.querySelector(
          '.ui-dialog .ui-dialog-buttonset button:last-of-type'
        );

        if (dialog && dialog.style.display !== 'none') {
          button.click();
        }
      }, 100);
      return id;
    }

    await driver
      .executeScript('return (' + execute.toString() + `)()`)
      .then((data) => {
        this.IntervalId = data;
      });
    return this.IntervalId;
  }

  async setStopAuto(id) {
    function execute(id) {
      clearInterval(id);
      console.log('stoped auto Close');
    }

    await driver.executeScript('return (' + execute.toString() + `)(${id})`);
  }
}

async function login(id, pass) {
  await driver.get(
    'https://nanext.alcnanext.jp/anetn/Student/stlogin/index/kurume-nct/'
  );
  await driver.findElement(By.css('#AccountId')).sendKeys(id);
  await driver.findElement(By.css('#Password')).sendKeys(pass);
  await driver.findElement(By.css('.nan-button')).click();
}

async function goToTopPage(index) {
  await wait(1);
  const btn = await find('#LbtSubCourseLink_0');
  await btn.click();
  const table = await (
    await find(
      `#DivAllSubCourseTable > table > tbody > tr > td:nth-of-type(2) tbody > tr:nth-of-type(${index}) a`
    )
  ).getAttribute('onClick');
  await driver.executeScript(table.split(':')[1] + '()').catch((e) => {
    console.log('');
  });
}

async function goToInput(obj) {
  await wait(1);
  const script = await obj.getAttribute('onClick');
  await driver.executeScript(script);
  await driver.wait(
    async () => (await driver.getAllWindowHandles()).length > 1,
    10000
  );
  await driver.switchTo().window((await driver.getAllWindowHandles())[1]);
}

async function solveInput() {
  await wait(1);
  await click(
    '#nan-contents-cover-buttons > .ui-layout-content > .nan-cover-area > .nan-button-action'
  );
  await click('.ui-dialog-buttonpane .ui-button');
  await click('.ui-dialog-buttonset button');

  async function execute() {
    let words = {};
    let en;
    let jp;
    let finished = false;
    const observer = new MutationObserver((mutations, obs) => {
      const rec = mutations[0];
      const newWord = rec.removedNodes[0].textContent;
      if (newWord.search(/[A-Za-z]/) != -1) {
        if (words[newWord] == undefined) {
          en = newWord;
        } else {
          obs.disconnect();
          finished = true;
        }
      } else if (en != undefined) {
        jp = newWord;
        words[en] = jp;
        console.log('en: ', en, 'jp: ', jp);
        en = jp = undefined;
      } else {
        jp = newWord;
      }
    });
    const el = document.querySelector('#nan-flashcard-inline > span');
    observer.observe(el, { childList: true });
    while (!finished) {
      await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    }
    return words;
  }
  const res = await driver
    .executeScript('return ' + execute.toString() + '()')
    .then((data) => {
      return data;
    });
  console.log('finished');

  await click('#nan-toolbox-footer > button');
  await click('.ui-dialog-buttonset > button:nth-of-type(1)');

  return res;
}

async function solvePart1(words) {
  await click('#nan-contents-cover-buttons > div:nth-of-type(1) button');
  await new Promise((resolve) => setTimeout(() => resolve(), 200));

  const id = await new AutoCloseModal().setAuto();
  await driver.wait(until.elementLocated(By.css('#nan-choice-0 > span')));

  async function execute(words) {
    let count = 0;
    let finished = false;
    const observer = new MutationObserver((_, obs) => {
      count++;
      const text1 = document.querySelector('#nan-choice-0 > span').textContent;
      const text2 = document.querySelector('#nan-choice-1 > span').textContent;
      const btn1 = document.querySelector('#nan-choice-0');
      const btn2 = document.querySelector('#nan-choice-1');

      let num;
      console.log(words);
      Object.keys(words).forEach((key) => {
        if (text1 == key || text1 == words[key]) {
          num = 1;
        } else if (text2 == key || text2 == words[key]) {
          num = 2;
        }
      });
      if (num === 1) {
        btn1.click();
      } else if (num === 2) {
        btn2.click();
      } else {
        throw new Error('見つからん');
      }

      if (count === 19) {
        obs.disconnect();
        finished = true;
      }
    });
    const el = document.querySelector('#nan-endless-inline > span');
    observer.observe(el, { childList: true });
    const text1 = document.querySelector('#nan-choice-0 > span').textContent;
    const text2 = document.querySelector('#nan-choice-1 > span').textContent;
    const btn1 = document.querySelector('#nan-choice-0');
    const btn2 = document.querySelector('#nan-choice-1');

    let num;
    Object.keys(words).forEach((key) => {
      if (text1 == key || text1 == words[key]) {
        num = 1;
      } else if (text2 == key || text2 == words[key]) {
        num = 2;
      }
    });
    if (num === 1) {
      btn1.click();
    } else if (num === 2) {
      btn2.click();
    } else {
      throw new Error('見つからん');
    }

    while (!finished) {
      await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    }
    return 'hello';
  }

  await driver
    .executeScript(
      'return (' + execute.toString() + `)(${JSON.stringify(words)})`,
      100000
    )
    .then((data) => {
      return data;
    });
  await new Promise((resolve) => setTimeout(() => resolve(), 2000));
  await click('#nan-toolbox-footer .nan-button-action');
  await driver.wait(async () => {
    const res = await driver
      .findElement(By.css('.nan-step-question-sentence-ja'))
      .getText();
    const dialog = await driver
      .findElement(By.css('.ui-dialog'))
      .getCssValue('display');
    return res != '' && dialog == 'none' ? true : false;
  }, 10000);

  return id;
}

async function solvePart2(words) {
  const text = await (await find('.nan-step-question-sentence-ja')).getText();
  await driver.wait(
    until.elementIsEnabled(
      driver.findElement(By.css('.nan-qa-answered-box textarea'))
    ),
    10000
  );

  await Promise.all(
    Object.keys(words).map(async (key) => {
      if (text === words[key]) {
        await driver.wait(
          until.elementIsVisible(
            await driver.findElement(By.css('.nan-qa-answered-box textarea'))
          )
        );
        const input = await driver.findElement(
          By.css('.nan-qa-answered-box textarea')
        );
        await driver
          .actions()
          .click(input)
          .sendKeys(key)
          .perform()
          .catch((e) => {});
      }
    })
  );

  const btn = await find('.nan-button-operation');
  await btn.click();
  const btn2 = await driver
    .wait(
      until.elementIsVisible(
        driver.findElement(By.css('.nan-toolbox-buttons .nan-button-action'))
      ),
      1000
    )
    .catch((e) => {
      console.log('Clear STEP2!');
      return false;
    });
  if (btn2) {
    await btn2.click();
  } else {
    await driver
      .wait(
        until.elementLocated(By.css('#nan-toolbox-footer .nan-button-action'))
      )
      .click();
  }
}

async function solvePart3() {
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 2000);
  });
  await driver
    .findElement(
      By.css('#nan-toolbox-content .nan-toolbox-buttons .nan-button-operation')
    )
    .click();
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 2000);
  });
  await driver
    .findElement(By.css('#nan-toolbox-footer .nan-button-action'))
    .click();
  console.log('clear Part3!');
}

async function solvePart4(words, id) {
  await new Promise((resolve) => setTimeout(() => resolve(), 2000));
  var btn1, btn2, btnText1, btnText2;
  async function execute(words) {
    let finished = false;
    const currentId = setInterval(() => {
      btn1 = document.querySelectorAll('#nan-choice-0');
      btn2 = document.querySelectorAll('#nan-choice-1');
      btn1 = btn1[btn1.length - 1];
      btn2 = btn2[btn2.length - 1];
      const result = document.getElementById('nan-vocabulary-results');
      btnText1 = document.querySelectorAll(
        '#nan-choice-0:nth-of-type(1) > .ui-button-text'
      )[1].textContent;
      btnText2 = document.querySelectorAll('#nan-choice-1 > .ui-button-text')[1]
        .textContent;
      console.log(btnText1, btnText2);

      if (result.style.display == 'block') {
        clearInterval(currentId);
        finished = true;
      }
      for (let k in words) {
        if (words[k] == btnText1) {
          const clientRect = btn1.getBoundingClientRect();
          const x = clientRect.x + 30;
          const y = clientRect.y + 30;
          btn1.dispatchEvent(
            new MouseEvent('click', {
              x: x,
              y: y,
            })
          );
        } else if (words[k] == btnText2) {
          const clientRect = btn2.getBoundingClientRect();
          const x = clientRect.x + 30;
          const y = clientRect.y + 30;
          btn2.dispatchEvent(
            new MouseEvent('click', {
              x: x,
              y: y,
            })
          );
        }
      }
    }, 1000);
    while (!finished) {
      await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    }
  }
  await driver
    .executeScript(
      'return (' + execute.toString() + `)(${JSON.stringify(words)})`
    )
    .then((data) => {
      console.log(data);
    });
  await new AutoCloseModal().setStopAuto(id);
  const goalBtn = await find('#nan-toolbox-footer > button');
  await goalBtn.click();
  const finBtn = await find(
    '.ui-dialog-buttonpane > .ui-dialog-buttonset > button:first-of-type'
  );
  await finBtn.click();
  console.log('clear Part4!');
}

async function solveDrill(words) {
  const id = await solvePart1(words);
  for await (_ of [...Array(20).keys()]) {
    await solvePart2(words);
  }
  await solvePart3();
  await solvePart4(words, id);
}

async function getWords(num) {
  await new Promise((resolve) => setTimeout(() => resolve(), 1000));
  await driver.switchTo().window((await driver.getAllWindowHandles())[0]);

  await driver.wait(
    until.elementLocated(
      By.css(
        `.nan-table-noborder > tbody > tr:nth-of-type(1) > td:nth-of-type(1)`
      )
    )
  );

  let count = 1;
  let finish = false;
  let input;

  await driver.wait(
    until.elementLocated(
      By.css(
        `.nan-table-noborder > tbody > tr:nth-of-type(${count}) > td:nth-of-type(1)`
      )
    )
  );

  while (finish == false) {
    const obj = await (
      await find(
        `.nan-table-noborder > tbody > tr:nth-of-type(${count}) > td:nth-of-type(1)`
      )
    ).getText();

    if (obj.startsWith('U') && obj.search(num.toString()) > 0) {
      input = await find(
        `.nan-table-noborder > tbody > tr:nth-of-type(${count}) > td:nth-of-type(3) a`
      );
      finish = true;
    }

    count++;
  }
  return input;
}

async function getDrill(num) {
  await new Promise((resolve) => setTimeout(() => resolve(), 1000));
  await driver.switchTo().window((await driver.getAllWindowHandles())[0]);

  await driver.wait(
    until.elementLocated(
      By.css(
        `.nan-table-noborder > tbody > tr:nth-of-type(1) > td:nth-of-type(1)`
      )
    )
  );

  let count = 1;
  let finish = false;
  let drill;

  await driver.wait(
    until.elementLocated(
      By.css(
        `.nan-table-noborder > tbody > tr:nth-of-type(${count}) > td:nth-of-type(1)`
      )
    )
  );

  while (finish == false) {
    const obj = await (
      await find(
        `.nan-table-noborder > tbody > tr:nth-of-type(${count}) > td:nth-of-type(1)`
      )
    ).getText();

    if (obj.startsWith('U') && obj.search(num.toString()) > 0) {
      drill = await find(
        `.nan-table-noborder > tbody > tr:nth-of-type(${
          count + 1
        }) > td:nth-of-type(1) > a`
      );
      finish = true;
    }

    count++;
  }
  return drill;
}

(async () => {
  const id = await readUserInput('Please type your login Id: ');
  const pass = await readUserInput('Please type your password: ');
  let now = Number(await readUserInput('Start Unit number: '));
  const TIMEOUT = 100000;

  await driver
    .manage()
    .setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });

  try {
    await login(id, pass);
    await goToTopPage(3);

    while (now <= 100) {
      const input = await getWords(now);
      await goToInput(input);
      const words = await solveInput();
      const drill = await getDrill(now);
      await goToInput(drill);
      await solveDrill(words);
      now++;
    }
  } catch (e) {
    console.error(e);
  } finally {
    await driver.quit();
  }
})();
