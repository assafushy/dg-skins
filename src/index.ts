import {
  DocumentSkin,
  WIQueryResults,
  WIData,
  WIProperty,
  StyleOptions,
} from "./models/json/wordJsonModels";
import logger from "./services/logger";
import JSONTable from "./models/json/table/JSONTable";
import JSONParagraph from "./models/json/paragraph/JSONParagraph";
import JSONHeaderParagraph from "./models/json/paragraph/JSONTestSuiteHeaderParagraph";
import JSONRichTextParagraph from "./models/json/paragraph/JSONRichTextParagraph";

export default class Skins {
  SKIN_TYPE_TABLE = "table";
  SKIN_TYPE_PARAGRAPH = "paragraph";
  SKIN_TYPE_TEST_PLAN = "test-plan";

  documentSkin: DocumentSkin = {
    templatePath: "",
    contentControls: [],
  };

  skinFormat: string = "json";

  constructor(skinFormat: string = "json", templatePath: string) {
    this.documentSkin.templatePath = templatePath;
    this.skinFormat = skinFormat;
  }

  async addNewContentToDocumentSkin(
    contetnControlTitle: string,
    skinType: string,
    data: any,
    styles: StyleOptions,
    headingLvl: number = 0,
    includeAttachments: boolean = true
  ): Promise<boolean> {
    try {
      let populatedSkin;
      switch (skinType) {
        case this.SKIN_TYPE_TABLE:
          populatedSkin = this.generateQueryBasedTable(
            data,
            styles,
            headingLvl
          );
          if (populatedSkin === false) {
            logger.error(
              `Could not generate table for content control :${contetnControlTitle}`
            );
            return false;
          }
          break;
        case this.SKIN_TYPE_PARAGRAPH:
          populatedSkin = this.generateQueryBasedParagraphs(
            data,
            styles,
            headingLvl
          );
          if (populatedSkin === false) {
            logger.error(
              `Could not generate paragraph for content control :${contetnControlTitle}`
            );
            return false;
          }
          break;
        case this.SKIN_TYPE_TEST_PLAN:
          populatedSkin = this.generateTestBasedSkin(
            data,
            styles,
            headingLvl,
            includeAttachments
          );
          if (populatedSkin === false) {
            logger.error(
              `Could not generate test skin for content control :${contetnControlTitle}`
            );
            return false;
          }
          break;
        default:
          logger.error(
            `Unknown skinType : ${skinType} - not appended to document skin`
          );
          return false;
      }

      return populatedSkin;

      //  await this.validateAndAppendContentControl(
      //   contetnControlTitle,
      //   populatedSkin
      // );
    } catch (error) {
      logger.error(
        `Fatal error happened when generate skin for : ${contetnControlTitle}`
      );
      return false;
    }
  } //addNewContentToDocumentSkin

  // iterates on content controls array:
  // if finds return true else creates content control and returns true
  // on error returns false
  async validateAndAppendContentControl(
    contetnControlTitle: string,
    populatedSkin: any
  ): Promise<boolean> {
    try {
      let isContetnControlExists: boolean[] = await Promise.all(
        this.documentSkin.contentControls.map((contentControl, i) => {
          if (contentControl.title === contetnControlTitle) {
            logger.debug(`Content control - ${contetnControlTitle} found on index ${i}
          populating with: ${contetnControlTitle}`);
            this.documentSkin.contentControls[i].wordObjects = [
              ...this.documentSkin.contentControls[i].wordObjects,
              ...populatedSkin,
            ];
            return true;
          }
          return false;
        }) //.map
      ); //Promise.all

      if (!isContetnControlExists.includes(true)) {
        let contentControlToAppend = {
          title: contetnControlTitle,
          wordObjects: populatedSkin,
        };

        logger.debug(`Content control - ${contetnControlTitle} not found
           appending to document title:
           ${JSON.stringify(contetnControlTitle)}`);
        this.documentSkin.contentControls.unshift(contentControlToAppend);
      }
      logger.info(
        `Appended new content control document:  ${contetnControlTitle}`
      );
      return true;
    } catch (error) {
      logger.error(`Error validating and appending to content control`);
      console.log(error);
    }
  } //validateAndAppendContentControl

  //parses data to the class skin format and returns the parsed data
  //returns false if supplied an invalid type or error occurd during parsing
  generateQueryBasedTable(
    data: WIQueryResults,
    styles: StyleOptions,
    headingLvl: number = 0
  ) {
    logger.debug(`Generating table as ${this.skinFormat}`);

    switch (this.skinFormat) {
      case "json":
        let tableSkin = new JSONTable(data, styles, headingLvl);
        return [tableSkin.getJSONTable()];
      case "html":
        logger.info(`Generating html table!`);
        break;
      default:
        return false;
    } //switch
  } //generateTable

  generateQueryBasedParagraphs(
    data: any,
    styles: StyleOptions,
    headingLvl: number = 0
  ) {
    logger.debug(`Generating paragraph as ${this.skinFormat}`);

    switch (this.skinFormat) {
      case "json":
        let paragraphs: any[] = [];
        data.forEach((wi: WIData) => {
          wi.fields.forEach((field: WIProperty) => {
            //Description and Test Description are handled in richText handler
            if (
              field.name === "Description: " ||
              field.name === "Test Description:"
            ) {
              let paragraphSkin = new JSONRichTextParagraph(
                field,
                styles,
                wi.Source,
                headingLvl + wi.level
              );
              paragraphs.push(paragraphSkin.getJSONRichTextParagraph());
            }

            //making sure ID is not printed
            //excluding Description and Test Description are handled in richText handler
            if (
              field.name !== "ID" &&
              field.name !== "Description: " &&
              field.name !== "Test Description:"
            ) {
              let paragraphSkin = new JSONParagraph(
                field,
                styles,
                wi.Source,
                headingLvl + wi.level
              );
              paragraphs.push(paragraphSkin.getJSONParagraph());
            }
          });
        });
        return paragraphs;
      case "html":
        logger.info(`Generating html paragraphs!`);
        break;
      default:
        return false;
    } //switch
  } //generateParagraph

  generateTestBasedSkin(
    data: any,
    styles: StyleOptions,
    headingLvl: number = 0,
    includeAttachments: boolean = true
  ) {
    logger.debug(`Generating testSkin as ${this.skinFormat}`);

    switch (this.skinFormat) {
      case "json":
        let testSkin: any[] = [];
        //create suite Header pragraph
        data.forEach((testSuite: any) => {
          let testSuiteParagraphSkin = new JSONHeaderParagraph(
            testSuite.suiteSkinData.fields,
            styles,
            testSuite.suiteSkinData.id || 0,
            testSuite.suiteSkinData.level
              ? headingLvl + testSuite.suiteSkinData.level
              : headingLvl
              ? headingLvl
              : 1
          );
          testSkin.push(testSuiteParagraphSkin.getJSONParagraph());

          testSuite.testCases.forEach((testcase) => {
            //create testcase Header paragraph
            let testCaseHeaderFields = [
              testcase.testCaseHeaderSkinData.fields[0],
              testcase.testCaseHeaderSkinData.fields[1],
            ];
            let testCaseParagraphSkin = new JSONHeaderParagraph(
              testCaseHeaderFields,
              styles,
              testcase.id || 0,
              testcase.testCaseHeaderSkinData.level
                ? headingLvl + testcase.testCaseHeaderSkinData.level
                : headingLvl
                ? headingLvl
                : 1
            );
            testSkin.push(testCaseParagraphSkin.getJSONParagraph());

            let testDescriptionTitleParagraph = new JSONParagraph(
              { name: "Title", value: "Test Description:" },
              styles,
              testcase.id || 0,
              0
            );
            testSkin.push(testDescriptionTitleParagraph.getJSONParagraph());

            let testDescriptionParagraph = new JSONRichTextParagraph(
              testcase.testCaseHeaderSkinData.fields[2],
              styles,
              testcase.id || 0,
              0
            );
            let richTextSkin: any[] =
              testDescriptionParagraph.getJSONRichTextParagraph();
            testSkin = [...testSkin, ...richTextSkin];
            try {
              if (testcase.testCaseStepsSkinData.length > 0) {
                let testProcedureTitleParagraph = new JSONParagraph(
                  { name: "Title", value: "Test Procedure:" },
                  styles,
                  testcase.id || 0,
                  0
                );
                testSkin.push(testProcedureTitleParagraph.getJSONParagraph());
                //create test steps table
                let tableSkin = new JSONTable(
                  testcase.testCaseStepsSkinData,
                  styles,
                  headingLvl
                );
                let populatedTableSkin = tableSkin.getJSONTable();
                testSkin.push(populatedTableSkin);
              }
            } catch (error) {
              logger.warn(
                `For suite id : ${testSuite.suiteSkinData.fields[0].value} , the testCaseStepsSkinData is not defined for ${testcase.testCaseHeaderSkinData.fields[0].value} `
              );
            }

            //attachments table
            if (testcase.testCaseAttachments) {
              if (
                testcase.testCaseAttachments.length > 0 &&
                includeAttachments == true
              ) {
                let testDescriptionTitleParagraph = new JSONParagraph(
                  { name: "Title", value: "Test Case Attachments:" },
                  styles,
                  testcase.id || 0,
                  0
                );
                testSkin.push(testDescriptionTitleParagraph.getJSONParagraph());
                //create test steps table
                let tableSkin = new JSONTable(
                  testcase.testCaseAttachments,
                  styles,
                  headingLvl
                );
                let populatedTableSkin = tableSkin.getJSONTable();
                testSkin.push(populatedTableSkin);
              }
            }
          });
        });
        return testSkin;
        break;
      case "html":
        logger.info(`Generating html test data!`);
        break;
      default:
        return false;
    } //switch
  } //generateTestBasedSkin

  getDocumentSkin(): DocumentSkin {
    return this.documentSkin;
  } //getDocumentSkin
}
